import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { binToHex, hexToBin } from '@bitauth/libauth';
import { WizardConnectQRDialog, useWizardConnect } from '@wizardconnect/react';
import { locateCovenantUtxo, prepareCovenantPayment, prepareCovenantRecovery, preparePolicyFunding, signAndBroadcastPayment, verifyBchProvider, type PaymentPlan, type PaymentReceipt, type WizardManager } from './adapters/bch';
import { projectConfig, releaseConfigurationIssues } from './lib/config';
import { createCovenantPolicy, type CovenantPolicy, type CovenantUtxo } from './lib/covenant';
import { mainnetPaymentEvidence } from './lib/evidence';
import { checkCashAddress, evaluateIntent, formatSatoshis, parseBchAmount } from './lib/policy';

const initialExpiry = (() => { const date=new Date(Date.now()+60*60*1000); const pad=(n:number)=>String(n).padStart(2,'0'); return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate())+'T'+pad(date.getHours())+':'+pad(date.getMinutes()); })();
const shortAddress = (value:string) => value.length>24?value.slice(0,12)+'...'+value.slice(-8):value;
const policyStorageKey=(network:'mainnet'|'chipnet')=>'pact-covenant-policy:'+network;
function readStoredPolicy(network:'mainnet'|'chipnet'):{policy:CovenantPolicy;outpoint:string}|null {
  try {
    const raw=localStorage.getItem(policyStorageKey(network));
    if(!raw)return null;
    const saved=JSON.parse(raw) as {recipient:string;ownerPublicKey:string;capSats:string;recoveryTimestamp:number;outpoint:string;network:string};
    if(saved.network!==network||!saved.outpoint||!/^[0-9a-f]{64}:\d+$/i.test(saved.outpoint))return null;
    const policy=createCovenantPolicy({network,recipient:saved.recipient,ownerPublicKey:hexToBin(saved.ownerPublicKey),capSats:BigInt(saved.capSats),recoveryTimestamp:saved.recoveryTimestamp});
    return {policy,outpoint:saved.outpoint};
  }catch{return null;}
}
function persistPolicy(policy:CovenantPolicy,outpoint:string){
  localStorage.setItem(policyStorageKey(policy.network),JSON.stringify({network:policy.network,recipient:policy.recipient,ownerPublicKey:binToHex(policy.ownerPublicKey),capSats:policy.capSats.toString(),recoveryTimestamp:policy.recoveryTimestamp,outpoint}));
}
function dateInputFromTimestamp(timestamp:number){const date=new Date(timestamp*1000);const pad=(value:number)=>String(value).padStart(2,'0');return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate())+'T'+pad(date.getHours())+':'+pad(date.getMinutes());}

export default function App() {
  const wallet=useWizardConnect({dappName:'Pact',persistSession:false});
  const [network,setNetwork]=useState<'mainnet'|'chipnet'>(projectConfig.network);
  const [providerState,setProviderState]=useState<'checking'|'online'|'offline'>('checking');
  const [providerRetry,setProviderRetry]=useState(0);
  const [providerError,setProviderError]=useState('');
  const [policyRecipient,setPolicyRecipient]=useState(projectConfig.demoRecipient);
  const [cap,setCap]=useState(projectConfig.demoAmountBch);
  const [expiry,setExpiry]=useState(initialExpiry);
  const [fundingAmount,setFundingAmount]=useState('0.001');
  const [policyCreated,setPolicyCreated]=useState(false);
  const [covenantPolicy,setCovenantPolicy]=useState<CovenantPolicy|null>(()=>readStoredPolicy(projectConfig.network)?.policy??null);
  const [policyOutpoint,setPolicyOutpoint]=useState(()=>readStoredPolicy(projectConfig.network)?.outpoint??'');
  const [policyUtxo,setPolicyUtxo]=useState<CovenantUtxo|null>(null);
  const [amount,setAmount]=useState(projectConfig.demoAmountBch);
  const [recipient,setRecipient]=useState(projectConfig.demoRecipient);
  const [formMessage,setFormMessage]=useState('');
  const [pendingPlan,setPendingPlan]=useState<PaymentPlan|null>(null);
  const reviewDialog=useRef<HTMLDialogElement>(null);
  const signingAbort=useRef<AbortController|null>(null);
  const [compactNav,setCompactNav]=useState(false);
  const [busy,setBusy]=useState(false);
  const [walletRequestState,setWalletRequestState]=useState<'idle'|'sending'|'waiting'|'signed'|'error'>('idle');
  const [walletRequestError,setWalletRequestError]=useState('');
  const [receipt,setReceipt]=useState<PaymentReceipt|null>(null);
  const [activity,setActivity]=useState<PaymentReceipt[]>([]);
  const [copied,setCopied]=useState('');
  const [pairingOpen,setPairingOpen]=useState(true);
  const [walletNotice,setWalletNotice]=useState('');
  const releaseIssues=useMemo(()=>releaseConfigurationIssues(),[]);

  const host=network==='mainnet'?projectConfig.mainnetElectrumHost:projectConfig.chipnetElectrumHost;
  const manager=wallet.manager as unknown as WizardManager|null;
  const connected=wallet.state==='connected'&&!!manager;
  const networkName=network==='mainnet'?'Mainnet':'Chipnet';

  useEffect(()=>{
    if(!connected){setWalletNotice('');return;}
    setPairingOpen(false);
    setWalletNotice('Wallet connected. Check the selected network before sending.');
    const timeout=window.setTimeout(()=>setWalletNotice(''),4500);
    return ()=>window.clearTimeout(timeout);
  },[connected]);

  useEffect(()=>{const update=()=>setCompactNav(window.scrollY>80);update();window.addEventListener('scroll',update,{passive:true});return ()=>window.removeEventListener('scroll',update);},[]);

  useEffect(()=>{const dialog=reviewDialog.current;if(!dialog)return;if(pendingPlan&&!dialog.open)dialog.showModal();else if(!pendingPlan&&dialog.open)dialog.close();},[pendingPlan]);

  useEffect(()=>{
    let active=true;
    setProviderState('checking');setProviderError('');
    verifyBchProvider(network,host).then(()=>{if(active)setProviderState('online');}).catch((error:unknown)=>{if(active){setProviderState('offline');setProviderError(error instanceof Error?error.message:String(error));}});
    return ()=>{active=false;};
  },[network,host,providerRetry]);

  useEffect(()=>{
    const stored=readStoredPolicy(network);
    setCovenantPolicy(stored?.policy??null);setPolicyOutpoint(stored?.outpoint??'');setPolicyUtxo(null);setPolicyCreated(false);
    if(stored){setPolicyRecipient(stored.policy.recipient);setCap(formatSatoshis(stored.policy.capSats));setExpiry(dateInputFromTimestamp(stored.policy.recoveryTimestamp));setRecipient(stored.policy.recipient);}
    else {setPolicyRecipient(network==='chipnet'?projectConfig.demoRecipient:'');setCap(network==='chipnet'?projectConfig.demoAmountBch:'');setRecipient(network==='chipnet'?projectConfig.demoRecipient:'');}
  },[network]);

  useEffect(()=>{
    if(!covenantPolicy||!policyOutpoint||covenantPolicy.network!==network){setPolicyUtxo(null);setPolicyCreated(false);return;}
    let active=true;
    const refresh=async()=>{try{const utxo=await locateCovenantUtxo({policy:covenantPolicy,hostOverride:host,expectedOutpoint:policyOutpoint});if(active){setPolicyUtxo(utxo);setPolicyCreated(!!utxo&&utxo.height>0);}}catch(error){if(active){setPolicyUtxo(null);setPolicyCreated(false);setFormMessage(error instanceof Error?error.message:String(error));}}};
    void refresh();const timer=window.setInterval(()=>void refresh(),15_000);
    return ()=>{active=false;window.clearInterval(timer);};
  },[covenantPolicy,policyOutpoint,network,host,providerRetry]);

  function evaluate(candidateAmount=amount,candidateRecipient=recipient) {
    return evaluateIntent({amountBch:candidateAmount,recipient:candidateRecipient,capBch:cap,policyRecipient,expiry:policyCreated?expiry:'',network,policyCreated});
  }

  useEffect(()=>{
    window.pact={proposePayment:(intent)=>{
      const result=evaluateIntent({amountBch:intent.amountBch,recipient:intent.recipient,capBch:cap,policyRecipient,expiry:policyCreated?expiry:'',network,policyCreated});
      if(result.allowed){setAmount(intent.amountBch);setRecipient(intent.recipient);setPendingPlan(null);setReceipt(null);setFormMessage('Agent proposal is ready for your review. No transaction was signed.');}
      return result;
    }};
    return ()=>{delete window.pact;};
  },[cap,policyRecipient,expiry,policyCreated,network]);

  async function savePolicy(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!connected||!manager){setFormMessage('Connect the owner wallet before creating and funding the covenant.');return;}
    if(providerState!=='online'){setFormMessage(providerError||'Wait for the selected BCH network provider before creating the covenant.');return;}
    if(network==='mainnet'&&!projectConfig.mainnetSendsEnabled){setFormMessage('Mainnet sends are not enabled in this build.');return;}
    if(covenantPolicy){setFormMessage('A covenant policy is already saved for this network. Spend it or recover it before creating another.');return;}
    const capValue=parseBchAmount(cap);
    const addressCheck=checkCashAddress(policyRecipient,network);
    const fundingSats=parseBchAmount(fundingAmount);
    if(capValue===null){setFormMessage('Enter a positive cap with no more than eight decimal places.');return;}
    if(!addressCheck.valid){setFormMessage(addressCheck.message);return;}
    if(!expiry||!Number.isFinite(Date.parse(expiry))||Date.parse(expiry)<=Date.now()){setFormMessage('Choose an owner recovery time in the future.');return;}
    if(fundingSats===null){setFormMessage('Enter a policy funding amount in BCH.');return;}
    const ownerKey=manager.getPubkey(0,0n);
    if(!ownerKey){setFormMessage('The connected wallet did not share its receive public key. Reconnect Paytaca and try again.');return;}
    let policy:CovenantPolicy;
    try{policy=createCovenantPolicy({network,recipient:policyRecipient,ownerPublicKey:ownerKey,capSats:capValue,recoveryTimestamp:Math.floor(Date.parse(expiry)/1000)});}
    catch(error){setFormMessage(error instanceof Error?error.message:String(error));return;}
    setBusy(true);setFormMessage('Preparing a wallet-reviewed transaction to fund the covenant.');
    try{const plan=await preparePolicyFunding({manager,network,hostOverride:host,policy,fundingSats,mainnetSendsEnabled:projectConfig.mainnetSendsEnabled});setPendingPlan(plan);setWalletRequestState('idle');setWalletRequestError('');}
    catch(error){setFormMessage(error instanceof Error?error.message:String(error));}
    finally{setBusy(false);}
  }

  async function reviewPayment(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setFormMessage('');setReceipt(null);setPendingPlan(null);setWalletRequestState('idle');setWalletRequestError('');
    const verdict=evaluate();
    if(!verdict.allowed){setFormMessage(verdict.reason);return;}
    if(!connected||!manager){setFormMessage('Connect a wallet before preparing a transaction.');return;}
    if(providerState!=='online'){setFormMessage(providerState==='checking'?'Waiting for the BCH network connection.':providerError||'The BCH network provider is offline.');return;}
    if(network==='mainnet'&&!projectConfig.mainnetSendsEnabled){setFormMessage('Mainnet sends are not enabled in this build.');return;}
    const amountSats=parseBchAmount(amount);
    if(amountSats===null){setFormMessage('Enter a valid payment amount.');return;}
    if(!covenantPolicy||!policyUtxo||!policyCreated){setFormMessage('Fund this covenant and wait for its transaction to confirm before spending it.');return;}
    setBusy(true);
    try { const utxo=await locateCovenantUtxo({policy:covenantPolicy,hostOverride:host,expectedOutpoint:policyOutpoint});if(!utxo||utxo.height<=0)throw new Error('The covenant output is not confirmed or has already been spent.');const plan=await prepareCovenantPayment({manager,policy:covenantPolicy,utxo,hostOverride:host,amountSats});setPendingPlan(plan); }
    catch(error){setFormMessage(error instanceof Error?error.message:String(error));}
    finally{setBusy(false);}
  }

  async function reviewRecovery() {
    if(!connected||!manager){setFormMessage('Reconnect the owner wallet before recovering the covenant balance.');return;}
    if(!covenantPolicy||!policyOutpoint){setFormMessage('There is no saved covenant to recover.');return;}
    setBusy(true);setFormMessage('Checking the confirmed covenant output and recovery time.');
    try{const utxo=await locateCovenantUtxo({policy:covenantPolicy,hostOverride:host,expectedOutpoint:policyOutpoint});if(!utxo||utxo.height<=0)throw new Error('The covenant output is not confirmed or has already been spent.');const plan=await prepareCovenantRecovery({manager,policy:covenantPolicy,utxo,hostOverride:host});setPendingPlan(plan);setWalletRequestState('idle');setWalletRequestError('');}
    catch(error){setFormMessage(error instanceof Error?error.message:String(error));}
    finally{setBusy(false);}
  }

  async function approveAndBroadcast() {
    if(!manager||!pendingPlan)return;
    if(pendingPlan.kind==='covenant-payment'){
      const beforeSigning=evaluate(formatSatoshis(pendingPlan.amountSats),pendingPlan.recipient);
      if(!beforeSigning.allowed){setPendingPlan(null);setFormMessage(beforeSigning.reason);return;}
    }
    const controller=new AbortController();
    signingAbort.current=controller;
    setBusy(true);setFormMessage('');setWalletRequestError('');setWalletRequestState('sending');
    const timeout=window.setTimeout(()=>{
      if(!controller.signal.aborted){
        setWalletRequestState('error');
        setWalletRequestError('Paytaca did not respond within 2 minutes. Open Paytaca, check its pending WizardConnect requests, reconnect if needed, then try again.');
        controller.abort(new Error('Wallet approval timed out.'));
      }
    },120_000);
    try {
      const result=await signAndBroadcastPayment({manager,plan:pendingPlan,hostOverride:host,signal:controller.signal,onRequestSent:()=>setWalletRequestState('waiting'),onSigned:()=>setWalletRequestState('signed'),validateBeforeBroadcast:()=>pendingPlan.kind==='covenant-payment'?(()=>{const latest=evaluate(formatSatoshis(pendingPlan.amountSats),pendingPlan.recipient);return latest.allowed?null:latest.reason;})():null});
      setReceipt(result);setActivity(current=>[result,...current]);setPendingPlan(null);
      if(pendingPlan.kind==='policy-funding'&&pendingPlan.policy){persistPolicy(pendingPlan.policy,result.txid+':0');setCovenantPolicy(pendingPlan.policy);setPolicyOutpoint(result.txid+':0');setPolicyUtxo(null);setPolicyCreated(false);setPolicyRecipient(pendingPlan.policy.recipient);setRecipient(pendingPlan.policy.recipient);setFormMessage('Covenant funding broadcast. Pact is waiting for confirmation before enabling spends.');}
      else if(pendingPlan.kind==='covenant-payment'&&pendingPlan.policy){const nextOutpoint=result.txid+':1';persistPolicy(pendingPlan.policy,nextOutpoint);setPolicyOutpoint(nextOutpoint);setPolicyUtxo(null);setPolicyCreated(false);setFormMessage('Covenant payment broadcast. Wait for confirmation before the next spend.');}
      else if(pendingPlan.kind==='covenant-recovery'){localStorage.removeItem(policyStorageKey(network));setCovenantPolicy(null);setPolicyOutpoint('');setPolicyUtxo(null);setPolicyCreated(false);setFormMessage('Owner recovery broadcast.');}
      else setFormMessage('Broadcast accepted by the verified BCH network provider.');
      setWalletRequestState('idle');
    } catch(error){
      if(!controller.signal.aborted){setWalletRequestState('error');setWalletRequestError(error instanceof Error?error.message:String(error));}
    } finally{window.clearTimeout(timeout);if(signingAbort.current===controller)signingAbort.current=null;setBusy(false);}
  }

  function cancelReview() {
    signingAbort.current?.abort(new Error('Approval request cancelled.'));
    signingAbort.current=null;
    setPendingPlan(null);setBusy(false);setWalletRequestState('idle');setWalletRequestError('');
  }

  async function copyText(label:string,value:string) {
    try { await navigator.clipboard.writeText(value);setCopied(label);window.setTimeout(()=>setCopied(''),1500); }
    catch { setFormMessage('Clipboard access is unavailable. Select the text and copy it manually.'); }
  }

  function changeNetwork(selected:'mainnet'|'chipnet') {
    if(selected===network)return;
    cancelReview();setNetwork(selected);setPolicyCreated(false);setReceipt(null);setCovenantPolicy(null);setPolicyOutpoint('');setPolicyUtxo(null);
    setFormMessage(connected?'Network changed. Reconnect a wallet on the selected network before sending.':'');
    if(connected)wallet.disconnect();
    setPolicyRecipient(selected==='chipnet'?projectConfig.demoRecipient:'');
    setCap(selected==='chipnet'?projectConfig.demoAmountBch:'');
    setAmount(selected==='chipnet'?projectConfig.demoAmountBch:'');
    setRecipient(selected==='chipnet'?projectConfig.demoRecipient:'');
  }
  const qrVisible=!connected&&!!wallet.uri&&!!wallet.qrUri&&pairingOpen;
  const decision=evaluate();
  const sendBlocked=!connected||providerState!=='online'||(network==='mainnet'&&!projectConfig.mainnetSendsEnabled)||!policyCreated||!policyUtxo||busy;

  return <div className="app-shell">
    <aside className="blaze-banner" aria-label="BCH BLAZE project links"><div className="blaze-banner-label"><span className="status-dot online"/>BCH BLAZE 2026</div><div className="blaze-banner-links">{projectConfig.deckUrl?<a href={projectConfig.deckUrl} target="_blank" rel="noreferrer">Widget Factory deck</a>:<><a href="https://docs.google.com/presentation/d/1Yfuk9CJkf4U9M_WukcELhumWgj3Ak6345Ewy8hSp-Hk/edit?slide=id.p#slide=id.p" target="_blank" rel="noreferrer">Widget Factory template</a><span>Project deck pending</span></>}<a href={projectConfig.repositoryUrl} target="_blank" rel="noreferrer">Source</a><span className="banner-address">EMBER2026: {projectConfig.donationAddressVerified?projectConfig.donationAddress:'No official receive address or category yet'}{projectConfig.donationAddress&&!projectConfig.donationAddressVerified&&' · OWNER-SUPPLIED / NOT OFFICIAL'}</span></div></aside>
    <header className={'topbar '+(compactNav?'topbar-compact':'')}>
      <a className="wordmark" href="#top" aria-label="Pact home">pact</a>
      <nav className="desktop-nav" aria-label="Main navigation"><a href="#rules">Policy</a><a href="#activity">Activity</a><a href="#how-it-works">How it works</a></nav><details className="mobile-nav"><summary aria-label="Open navigation">Menu</summary><div className="mobile-menu-links"><a href="#rules">Policy</a><a href="#activity">Activity</a><a href="#how-it-works">How it works</a></div></details>
      <div className="topbar-actions">
        <div className="network-control"><span className={'status-dot '+(providerState==='online'?'online':providerState==='offline'?'offline':'')} title={providerState==='online'?'BCH provider online':providerState==='offline'?'BCH provider offline':'Checking BCH provider'} aria-hidden="true"/><div className="network-switch" role="group" aria-label="Select Bitcoin Cash network"><button type="button" className={'network-option '+(network==='chipnet'?'selected':'')} aria-pressed={network==='chipnet'} onClick={()=>changeNetwork('chipnet')}>Chipnet</button><button type="button" className={'network-option '+(network==='mainnet'?'selected':'')} aria-pressed={network==='mainnet'} onClick={()=>changeNetwork('mainnet')}>BCH Mainnet</button></div></div>
        {connected?<button className="wallet-pill connected-pill" onClick={()=>wallet.disconnect()}><span className="status-dot online"/>{wallet.walletName||'Wallet connected'}<span className="disconnect-mark">x</span></button>:<button className="button button-small button-outline" onClick={()=>{setPairingOpen(true);wallet.connect();}}>Connect wallet</button>}
      </div>
    </header>

    <main id="top">
      <section className="hero-wrap">
        <div className="hero-grid">
          <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/>BITCOIN CASH / AGENT PAYMENTS</div><h1>Set the limits.<br/><span>Keep the keys.</span></h1><p className="hero-description">Give an agent a BCH spending cap and an approved recipient. Pact makes the covenant boundary and payment result visible.</p><div className="hero-actions"><a className="button button-primary" href="#rules">Create a spending rule</a><a className="text-link" href="#payment">Try the payment demo</a></div></div>
        </div>
        <div className="hero-bottom"><span>BUILT FOR BITCOIN CASH</span><span className="hero-bottom-line"/><span>HUMAN APPROVAL STAYS IN THE LOOP</span><span className="hero-bottom-right">01 / 04</span></div>
      </section>

      <section className="workspace-section section-pad" id="workspace">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>THE CONTROL ROOM</div><h2>Your spending workspace</h2><p>Set one rule, review one payment, keep control of every signature.</p></div><div className="provider-indicator"><span className={'status-dot '+(providerState==='online'?'online':providerState==='offline'?'offline':'')}/><span>{providerState==='online'?'BCH NETWORK READY':providerState==='checking'?'CHECKING NETWORK':'NETWORK UNAVAILABLE'}</span><span className="provider-network">{networkName}</span></div></div>
        {releaseIssues.length>0&&<div className="setup-banner checklist-notice"><div className="setup-icon" aria-hidden="true">i</div><div><strong>Demo configuration: {releaseIssues.length} item{releaseIssues.length===1?'':'s'} to review</strong><span>These are demo configuration items. They do not mean the wallet connection or Mainnet send path is unavailable.</span></div><a href="#release-checklist">View checklist <span aria-hidden="true">-&gt;</span></a></div>}
        <aside className="mainnet-proof" aria-label="Confirmed Bitcoin Cash Mainnet demo payment">
          <div className="mainnet-proof-status"><span className="status-dot online"/>CONFIRMED MAINNET DEMO</div>
          <div className="mainnet-proof-copy"><strong>1,000 sats sent · block {mainnetPaymentEvidence.blockHeight}</strong><span>Confirmed {mainnetPaymentEvidence.confirmedAt} · 226 sat fee · ordinary WizardConnect payment</span><code>{mainnetPaymentEvidence.transactionId}</code></div>
          <a href={mainnetPaymentEvidence.explorerUrl} target="_blank" rel="noreferrer">View transaction <span aria-hidden="true">-&gt;</span></a>
        </aside>
        {wallet.error&&<div className="inline-alert error-alert" role="alert">{wallet.error}</div>}
        {providerState==='offline'&&<div className="inline-alert error-alert" role="status"><span>{providerError||'Unable to reach a BCH provider.'}</span><button className="retry-button" type="button" onClick={()=>setProviderRetry(value=>value+1)}>Retry connection</button></div>}
        <div className="workspace-grid">
          <article className="panel rule-panel" id="rules"><div className="panel-head"><div><span className="panel-kicker">01 / ON-CHAIN POLICY</span><h3>Set the boundary</h3></div><span className={'state-chip '+(policyCreated?'state-live':'state-draft')}><span className="status-dot"/>{policyCreated?'FUNDED · CONFIRMED':covenantPolicy?'WAITING FOR CONFIRMATION':'NOT FUNDED'}</span></div><p className="panel-intro">Commit one BCH recipient and a per-payment cap in a covenant output. The owner wallet reviews and signs each payment.</p>
            <form onSubmit={savePolicy} className="stack-form"><label className="field-label" htmlFor="policy-recipient">Approved recipient <span className="field-hint">ONE ADDRESS</span></label><div className="input-wrap"><input id="policy-recipient" value={policyRecipient} onChange={event=>setPolicyRecipient(event.target.value)} placeholder={network==='chipnet'?'bchtest:...':'bitcoincash:...'} autoComplete="off" spellCheck={false} readOnly={!!covenantPolicy}/><button type="button" className="input-action" aria-label="Copy recipient address" onClick={()=>copyText('address',policyRecipient)} disabled={!policyRecipient}>{copied==='address'?'Copied':'Copy'}</button></div>
              <div className="field-row"><div className="field-block"><label className="field-label" htmlFor="cap">Per-payment cap <span className="field-hint">BCH</span></label><div className="input-wrap amount-wrap"><input id="cap" inputMode="decimal" value={cap} onChange={event=>setCap(event.target.value)} placeholder="0.00" readOnly={!!covenantPolicy}/><span className="input-suffix">BCH</span></div></div><div className="field-block"><label className="field-label" htmlFor="expiry">Owner recovery available after</label><input className="text-input" id="expiry" type="datetime-local" value={expiry} onChange={event=>setExpiry(event.target.value)} readOnly={!!covenantPolicy}/></div></div>
              {!covenantPolicy&&<label className="field-label" htmlFor="funding-amount">Fund the covenant <span className="field-hint">BCH · MINIMUM CAP + 0.000205</span></label>}
              {!covenantPolicy&&<div className="input-wrap amount-wrap"><input id="funding-amount" inputMode="decimal" value={fundingAmount} onChange={event=>setFundingAmount(event.target.value)} placeholder="0.001"/><span className="input-suffix">BCH</span></div>}
              {covenantPolicy&&<div className="rule-note"><span className="note-lock">{policyCreated?'✓':'…'}</span><span>{policyCreated?`Confirmed policy output ${policyUtxo?.txid}:${policyUtxo?.vout} holds ${policyUtxo?formatSatoshis(policyUtxo.valueSats):'—'} BCH.`:'Policy funding was broadcast. Pact is checking the BCH network and will enable spending after the output confirms.'} Covenant address: {covenantPolicy.address}</span></div>}
              <div className="rule-note"><span className="note-lock">!</span><span>The covenant enforces the recipient, per-payment cap, token-free spend, and same-script balance continuation. The recovery time enables owner recovery; it does not disable the payment branch on-chain.</span></div>
              {!covenantPolicy&&<button type="submit" className="button button-secondary full-button" disabled={busy}>{busy?'Preparing funding…':'Review covenant funding'} <span aria-hidden="true">-&gt;</span></button>}
            </form>
            {policyCreated&&covenantPolicy&&Math.floor(Date.now()/1000)>=covenantPolicy.recoveryTimestamp&&<button type="button" className="button button-outline full-button recovery-button" onClick={()=>void reviewRecovery()} disabled={busy}>Review owner recovery <span aria-hidden="true">-&gt;</span></button>}
          </article>

          <article className="panel payment-panel" id="payment"><div className="panel-head"><div><span className="panel-kicker">02 / PAYMENT REVIEW</span><h3>Prepare a payment</h3></div><span className="review-label"><span className="review-ring"/>REVIEW REQUIRED</span></div><p className="panel-intro">A matching proposal prepares a transaction for your wallet. Nothing is signed until you approve it there.</p>
            <form onSubmit={reviewPayment} className="stack-form"><div className="field-row payment-amount-row"><div className="field-block"><label className="field-label" htmlFor="pay-amount">Amount <span className="field-hint">BCH</span></label><div className="input-wrap amount-wrap"><input id="pay-amount" inputMode="decimal" value={amount} onChange={event=>{setAmount(event.target.value);setPendingPlan(null);setReceipt(null);}} placeholder="0.00"/><span className="input-suffix">BCH</span></div></div><div className="amount-cap"><span>YOUR CAP</span><strong>{covenantPolicy?formatSatoshis(covenantPolicy.capSats):'--'} <small>BCH</small></strong></div></div><label className="field-label" htmlFor="pay-recipient">Recipient</label><input className="text-input" id="pay-recipient" value={covenantPolicy?.recipient??recipient} readOnly={!!covenantPolicy} onChange={event=>{setRecipient(event.target.value);setPendingPlan(null);setReceipt(null);}} placeholder="Enter the approved address" autoComplete="off" spellCheck={false}/><div className="payment-verdict"><span className={'verdict-indicator '+(decision.allowed?'verdict-ok':'')}/><span>{decision.allowed?'Matches the covenant recipient and cap':policyCreated?decision.reason:'Fund a covenant and wait for confirmation to enable payment'}</span><span className="verdict-ui">ON-CHAIN CHECKS</span></div><button type="submit" className="button button-primary full-button" disabled={sendBlocked}>{busy?'Preparing...':'Review covenant payment'} <span aria-hidden="true">-&gt;</span></button><p className="microcopy">The connected owner wallet signs the covenant input. The contract limits the recipient and amount, returns the remaining balance to itself, and pays the fixed 20,000 sat fee.</p></form>
            {formMessage&&<div className="form-message" role="status">{formMessage}</div>}
            {receipt&&<div className="receipt-card" role="status"><span className="receipt-check">OK</span><div><strong>{receipt.kind==='policy-funding'?'Covenant funding broadcast':receipt.kind==='covenant-payment'?'Covenant payment broadcast':receipt.kind==='covenant-recovery'?'Owner recovery broadcast':'Payment broadcast'}</strong><a href={receipt.explorerUrl} target="_blank" rel="noreferrer">{shortAddress(receipt.txid)} <span aria-hidden="true">-&gt;</span></a></div></div>}
          </article>

          <article className="panel agent-panel"><div className="agent-top"><div><span className="panel-kicker">03 / AGENT INTERFACE</span><h3>Propose, then pause.</h3></div><span className="agent-status">READY FOR INTEGRATION</span></div><p className="panel-intro">Your agent can ask Pact to check a proposal. The call returns a decision and never signs or broadcasts.</p><div className="code-card"><div className="code-top"><span><i/><i/><i/></span><span>YOUR APP / JAVASCRIPT</span><button type="button" onClick={()=>copyText('code',"window.pact.proposePayment({ amountBch: requestedAmountBch, recipient: approvedRecipient })")}>{copied==='code'?'COPIED':'COPY'}</button></div><pre><code><span className="code-muted">// Checks the active covenant proposal; wallet approval is still required</span>{'\n'}<span className="code-purple">const</span> decision = window.pact.<span className="code-green">proposePayment</span>({'{'}{'\n'}  amountBch: <span className="code-yellow">requestedAmountBch</span>,{'\n'}  recipient: <span className="code-yellow">approvedRecipient</span>{'\n'}{'}'});{'\n'}<span className="code-purple">if</span> (decision.allowed) {'{'}{'\n'}  <span className="code-muted">// User reviews and approves separately</span>{'\n'}{'}'}</code></pre></div><div className="agent-foot"><span><span className="mini-shield">U</span> Human approval required</span><span>NO AUTO-SIGNING</span></div></article>

          <article className="panel activity-panel" id="activity"><div className="panel-head"><div><span className="panel-kicker">04 / PAYMENT HISTORY</span><h3>Recent activity</h3></div><span className="activity-count">{activity.length.toString().padStart(2,'0')}</span></div><div className="activity-list">{activity.length===0?<div className="empty-activity"><span className="empty-icon">--</span><strong>No payments yet</strong><p>Successful broadcasts in this session will appear here.</p></div>:activity.map(item=><div className="activity-item" key={item.txid}><span className="activity-symbol">B</span><div className="activity-detail"><strong>Payment sent</strong><a href={item.explorerUrl} target="_blank" rel="noreferrer">{shortAddress(item.txid)}</a></div><div className="activity-amount"><strong>{formatSatoshis(item.amountSats)} BCH</strong><span>{item.network==='mainnet'?'Mainnet':'Chipnet'}</span></div></div>)}</div><div className="activity-foot"><span>Only broadcasts from this browser session</span><span>VERIFIED TXIDS</span></div></article>
        </div>
      </section>

      <section className="boundary-section section-pad" id="policy-boundary">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>POLICY BOUNDARY</div><h2>What Pact checks</h2><p>Policy funding and payment use a P2SH covenant input. The connected owner wallet signs each payment, and the signed transaction is checked locally against the BCH 2023 virtual machine before broadcast.</p></div><span className="section-index">P2SH / BCH</span></div>
        <div className="boundary-register">
          <div className="boundary-row"><strong>Per-payment cap</strong><span>The covenant refuses a payment output above the committed cap.</span><span className="boundary-status">SCRIPT RULE</span></div>
          <div className="boundary-row"><strong>Approved recipient</strong><span>The covenant requires the payment output to match the committed BCH locking script.</span><span className="boundary-status">SCRIPT RULE</span></div>
          <div className="boundary-row"><strong>Balance and fee</strong><span>One covenant input, no CashTokens, same-script continuation, and an exact 20,000 sat transaction fee.</span><span className="boundary-status">SCRIPT RULE</span></div>
          <div className="boundary-row"><strong>Recovery time</strong><span>After the configured time the owner can recover the balance. BCH script cannot read wall-clock time independently, so this does not make the payment branch expire on-chain.</span><span className="boundary-status">OWNER RECOVERY</span></div>
          <div className="boundary-row"><strong>Budget scope</strong><span>Each funded covenant output spends down its own balance. Separately funded covenant outputs have separate balances; there is no shared lifetime cap.</span><span className="boundary-status">SINGLE OUTPUT</span></div>
        </div>
        {projectConfig.xoTransactionUrl&&<div className="boundary-proof"><span className="boundary-status">{projectConfig.xoTransactionStatus === 'confirmed' ? `SEPARATE XO INVITATION · CHIPNET BLOCK ${projectConfig.xoConfirmationHeight}` : 'SEPARATE XO INVITATION · PENDING'}</span><a className="text-link" href={projectConfig.xoTransactionUrl} target="_blank" rel="noreferrer">Inspect the Chipnet XO invitation <span aria-hidden="true">-&gt;</span></a><a className="text-link" href={`${projectConfig.repositoryUrl}/blob/main/contracts/evidence/chipnet-invitation.json`} target="_blank" rel="noreferrer">Open its signed evidence <span aria-hidden="true">-&gt;</span></a></div>}
      </section>
      <section className="guided-section section-pad" id="how-it-works"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>GUIDED PAYMENT</div><h2>Review each step before signing.</h2><p>The wallet remains the final approval point for every transaction.</p></div><span className="section-index">BCH / {networkName}</span></div><div className="guided-grid"><div className="guided-instructions"><div className="guided-step"><span>01</span><p>Connect the owner wallet through WizardConnect and check the network.</p></div><div className="guided-step"><span>02</span><p>Choose the approved recipient, per-payment cap, recovery time, and funding amount.</p></div><div className="guided-step"><span>03</span><p>Approve covenant funding in the wallet and wait for its output to confirm.</p></div><div className="guided-step"><span>04</span><p>Prepare a payment from the confirmed covenant, inspect its outputs and fee, then approve it in the wallet.</p></div></div><div className="guided-summary"><div><span>NETWORK PROVIDER</span><strong>{networkName} / {providerState==='online'?'connected':providerState==='checking'?'checking':'unavailable'}</strong></div><div><span>WALLET</span><strong>{connected?(wallet.walletName||'Connected'):'Not connected'}</strong></div><div><span>POLICY STATE</span><strong>{policyCreated?'Confirmed covenant output':'No confirmed covenant output'}</strong></div><p>A broadcast is not a confirmation. Pact enables spends only after it finds the expected covenant output with a positive block height.</p></div></div></section>
      <section className="integrations-section section-pad" id="integrations"><div className="integration-copy"><div className="eyebrow"><span className="eyebrow-line"/>CONNECTED WITH CARE</div><h2>Wallet keys stay<br/><span>with your wallet.</span></h2><p>Pact pairs through WizardConnect. It requests public addresses and a signature for a reviewed transaction. The app does not ask for a seed phrase.</p><a className="text-link" href="https://docs.riftenlabs.com/wizardconnect/react/" target="_blank" rel="noreferrer">WizardConnect integration <span aria-hidden="true">-&gt;</span></a></div><div className="integration-card"><div className="integration-card-head"><span>LIVE CONNECTION</span><span className="live-led"/></div><div className="integration-logos"><div className="integration-logo pact-mini"><i/><i/><i/><i/></div><span className="integration-linkline"/><div className="integration-logo wallet-logo">W</div><span className="integration-linkline"/><div className="integration-logo chain-logo">B</div></div><div className="integration-names"><span>Pact</span><span>WizardConnect</span><span>Bitcoin Cash</span></div><div className="integration-details"><div><span>PAIRING</span><strong>Ephemeral session</strong></div><div><span>NETWORK</span><strong>{networkName}</strong></div><div><span>APPROVAL</span><strong>Every transaction</strong></div></div><div className="integration-security"><span>+</span><p>Public keys for address discovery. Your wallet signs only after you review.</p></div></div></section>

      <section className="token-section section-pad" id="token"><div className="token-panel"><div className="token-copy"><div className="eyebrow"><span className="eyebrow-line"/>COMMUNITY TOKEN</div><h2>EMBER2026</h2><p>{projectConfig.donationAddressVerified?'The Pact team confirmed this mainnet CashTokens address and its token category.':'BCH BLAZE says EMBER2026 has not been minted or distributed. No official mainnet receive address or token category exists yet; the displayed address was supplied by the project owner and is not linked to EMBER2026.'} Pact does not claim a token allocation. The EMBER receive address is for Community Choice and is separate from Pact BCH payment destinations.</p><div className="token-address">{projectConfig.donationAddress?`Owner supplied, not official: ${projectConfig.donationAddress}`:'No official receive address has been issued.'}</div></div><div className="token-aside"><span>STATUS</span><strong>{projectConfig.donationAddressVerified?'TEAM VERIFIED':projectConfig.donationAddress?'NOT OFFICIAL':'NOT ISSUED'}</strong><span className="token-aside-line"/><small>ADDRESS + CATEGORY PENDING</small></div></div></section>

      <section className="submission-section section-pad" id="release-checklist">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>BLAZE MAINNET TRACK</div><h2>Submission checklist</h2><p>The confirmed ordinary Mainnet send proves the wallet send path. Pact's covenant demo is a separate feature and should be shown with its own contract transaction evidence.</p></div><span className="section-index">03 / SUBMISSION</span></div>
        <div className="checklist-grid">
          {[
            ['DoraHacks registration','You previously confirmed that Pact is registered.',true],
            ['Mainnet BCH payment','A 1,000 sat WizardConnect payment confirmed in block '+mainnetPaymentEvidence.blockHeight+'.',!!mainnetPaymentEvidence.transactionId],
            ['Live demo','The deployed Pact site is available for judges to open.',window.location.hostname!=='localhost'&&window.location.hostname!=='127.0.0.1'],
            ['WizardConnect','The wallet connection and Mainnet payment path have been exercised.',!!mainnetPaymentEvidence.transactionId],
            ['Widget Factory presentation','The completed editable PPTX is linked above. Confirm the event form accepts PPTX.',!!projectConfig.deckUrl],
            ['DoraHacks project submission','Attach the demo, repository, and presentation in the event portal.',false],
            ['BCH BLAZE Telegram confirmation','Post the project confirmation in the BCH BLAZE Telegram and keep its link or screenshot.',false],
          ].map(([title,detail,done])=><div className="checklist-row" key={String(title)}><span className={'checklist-check '+(done?'done':'')}>{done?'OK':'-'}</span><div><strong>{title}</strong><span>{String(detail)}</span></div><span className={'checklist-state '+(done?'done':'')}>{done?(title==='Mainnet BCH payment'?'CONFIRMED':'READY'):'OWNER ACTION'}</span></div>)}
        </div>

      </section>
    </main>
    <footer className="footer"><a className="wordmark" href="#top">pact</a><span>ON-CHAIN COVENANT RULES, WIZARDCONNECT SIGNING, AND REAL BCH TRANSACTIONS</span><div><a href={projectConfig.repositoryUrl} target="_blank" rel="noreferrer">GitHub</a><a href="https://bchblaze.cash/" target="_blank" rel="noreferrer">BCH BLAZE</a><span>BUILT FOR REVIEW</span></div></footer>
    <dialog ref={reviewDialog} className="review-dialog" aria-labelledby="review-title" onCancel={cancelReview}>{pendingPlan&&<><div className="review-card-head"><strong id="review-title">{pendingPlan.kind==='policy-funding'?'Confirm covenant funding':pendingPlan.kind==='covenant-recovery'?'Confirm owner recovery':'Confirm this covenant payment'}</strong><span>{walletRequestState==='signed'?'SIGNED · BROADCASTING':'NOT BROADCAST'}</span></div><p className="review-explainer">Nothing has been sent yet. Approve this exact transaction in Paytaca; Pact broadcasts it only after the wallet returns its signature.</p><div className="review-line"><span>Network</span><strong>{pendingPlan.network==='mainnet'?'Bitcoin Cash Mainnet':'BCH Chipnet'}</strong></div><div className="review-line"><span>Recipient</span><strong className="address-full">{pendingPlan.recipient}</strong></div><div className="review-line"><span>{pendingPlan.kind==='policy-funding'?'Covenant funding amount':'Payment amount'}</span><strong>{formatSatoshis(pendingPlan.amountSats)} BCH</strong></div><div className="review-line"><span>{pendingPlan.kind==='policy-funding'?'Confirmed wallet BCH':'Confirmed covenant BCH'}</span><strong>{formatSatoshis(pendingPlan.availableBalanceSats)} BCH</strong></div><div className="review-line"><span>{pendingPlan.kind==='policy-funding'?'Estimated network fee':'Fixed covenant fee'}</span><strong>{formatSatoshis(pendingPlan.feeSats)} BCH</strong></div>{pendingPlan.kind?.startsWith('covenant-')&&pendingPlan.policy&&<div className="review-line"><span>Contract address</span><strong className="address-full">{pendingPlan.policy.address}</strong></div>}{busy&&<div className="wallet-request-status" role="status">{walletRequestState==='sending'?'Sending approval request through WizardConnect…':walletRequestState==='signed'?'Paytaca approved it. Pact is validating and broadcasting the transaction…':'Request sent. Open Paytaca on your phone and check its pending WizardConnect request.'}</div>}{walletRequestError&&<div className="wallet-request-error" role="alert">{walletRequestError}</div>}<div className="review-actions"><button type="button" className="button button-outline" onClick={cancelReview}>{busy?'Cancel request':'Cancel'}</button><button type="button" className="button button-primary" onClick={approveAndBroadcast} disabled={busy}>{busy?'Waiting for Paytaca…':'Open wallet to approve'}</button></div></>}</dialog>
    {qrVisible&&<WizardConnectQRDialog show={qrVisible} uri={wallet.uri!} qrUri={wallet.qrUri!} onClose={()=>setPairingOpen(false)} title="Connect your BCH wallet" subtitle="Scan with a WizardConnect compatible wallet" theme={{dialogBackground:'#151D1A',headerBackground:'#101715',titleColor:'#F2F5F1',subtitleColor:'#A6B2AA',borderColor:'rgba(229,242,234,.16)',qrForeground:'#0B0F0E',qrBackground:'#F2F5F1'}}/>}
    {wallet.state==='connecting'&&<div className="wallet-connecting" role="status"><span className="spinner"/>Waiting for wallet connection</div>}
    {walletNotice&&<div className="wallet-notice" role="status"><span className="status-dot online" aria-hidden="true"/>{walletNotice}</div>}
  </div>;
}
