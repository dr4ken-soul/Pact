import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { WizardConnectQRDialog, useWizardConnect } from '@wizardconnect/react';
import { prepareBchPayment, signAndBroadcastPayment, verifyBchProvider, type PaymentPlan, type PaymentReceipt, type WizardManager } from './adapters/bch';
import { projectConfig, releaseConfigurationIssues } from './lib/config';
import { checkCashAddress, evaluateIntent, formatSatoshis, parseBchAmount } from './lib/policy';

const initialExpiry = (() => { const date=new Date(Date.now()+60*60*1000); const pad=(n:number)=>String(n).padStart(2,'0'); return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate())+'T'+pad(date.getHours())+':'+pad(date.getMinutes()); })();
const shortAddress = (value:string) => value.length>24?value.slice(0,12)+'...'+value.slice(-8):value;

export default function App() {
  const wallet=useWizardConnect({dappName:'Pact',persistSession:false});
  const [network,setNetwork]=useState<'mainnet'|'chipnet'>(projectConfig.network);
  const [providerState,setProviderState]=useState<'checking'|'online'|'offline'>('checking');
  const [providerRetry,setProviderRetry]=useState(0);
  const [providerError,setProviderError]=useState('');
  const [policyRecipient,setPolicyRecipient]=useState(projectConfig.demoRecipient);
  const [cap,setCap]=useState(projectConfig.demoAmountBch);
  const [expiry,setExpiry]=useState(initialExpiry);
  const [policyCreated,setPolicyCreated]=useState(false);
  const [amount,setAmount]=useState(projectConfig.demoAmountBch);
  const [recipient,setRecipient]=useState(projectConfig.demoRecipient);
  const [formMessage,setFormMessage]=useState('');
  const [pendingPlan,setPendingPlan]=useState<PaymentPlan|null>(null);
  const reviewDialog=useRef<HTMLDialogElement>(null);
  const [compactNav,setCompactNav]=useState(false);
  const [busy,setBusy]=useState(false);
  const [receipt,setReceipt]=useState<PaymentReceipt|null>(null);
  const [activity,setActivity]=useState<PaymentReceipt[]>([]);
  const [copied,setCopied]=useState('');
  const [pairingOpen,setPairingOpen]=useState(true);
  const releaseIssues=useMemo(()=>releaseConfigurationIssues(),[]);
  const host=network==='mainnet'?projectConfig.mainnetElectrumHost:projectConfig.chipnetElectrumHost;
  const manager=wallet.manager as unknown as WizardManager|null;
  const connected=wallet.state==='connected'&&!!manager;
  const networkName=network==='mainnet'?'Mainnet':'Chipnet';

  useEffect(()=>{const update=()=>setCompactNav(window.scrollY>80);update();window.addEventListener('scroll',update,{passive:true});return ()=>window.removeEventListener('scroll',update);},[]);

  useEffect(()=>{const dialog=reviewDialog.current;if(!dialog)return;if(pendingPlan&&!dialog.open)dialog.showModal();else if(!pendingPlan&&dialog.open)dialog.close();},[pendingPlan]);

  useEffect(()=>{
    let active=true;
    setProviderState('checking');setProviderError('');
    verifyBchProvider(network,host).then(()=>{if(active)setProviderState('online');}).catch((error:unknown)=>{if(active){setProviderState('offline');setProviderError(error instanceof Error?error.message:String(error));}});
    return ()=>{active=false;};
  },[network,host,providerRetry]);

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

  function savePolicy(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const capValue=parseBchAmount(cap);
    const addressCheck=checkCashAddress(policyRecipient,network);
    if(capValue===null){setPolicyCreated(false);setFormMessage('Enter a positive cap with no more than eight decimal places.');return;}
    if(!addressCheck.valid){setPolicyCreated(false);setFormMessage(addressCheck.message);return;}
    if(!expiry||!Number.isFinite(Date.parse(expiry))||Date.parse(expiry)<=Date.now()){setPolicyCreated(false);setFormMessage('Choose a rule expiry in the future.');return;}
    setPolicyCreated(true);setFormMessage('Rule saved for this browser session. This is an app check, not an on-chain covenant.');
  }

  async function reviewPayment(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setFormMessage('');setReceipt(null);setPendingPlan(null);
    const verdict=evaluate();
    if(!verdict.allowed){setFormMessage(verdict.reason);return;}
    if(!connected||!manager){setFormMessage('Connect a wallet before preparing a transaction.');return;}
    if(providerState!=='online'){setFormMessage(providerState==='checking'?'Waiting for the BCH network connection.':providerError||'The BCH network provider is offline.');return;}
    if(network==='mainnet'&&!projectConfig.mainnetSendsEnabled){setFormMessage('Mainnet sends are disabled. Complete Chipnet checks before enabling them.');return;}
    const amountSats=parseBchAmount(amount),capSats=parseBchAmount(cap);
    if(amountSats===null||capSats===null){setFormMessage('Enter a valid amount and cap.');return;}
    setBusy(true);
    try { const plan=await prepareBchPayment({manager,network,hostOverride:host,recipient,amountSats,capSats,mainnetSendsEnabled:projectConfig.mainnetSendsEnabled});setPendingPlan(plan); }
    catch(error){setFormMessage(error instanceof Error?error.message:String(error));}
    finally{setBusy(false);}
  }

  async function approveAndBroadcast() {
    if(!manager||!pendingPlan)return;
    const beforeSigning=evaluate(formatSatoshis(pendingPlan.amountSats),pendingPlan.recipient);
    if(!beforeSigning.allowed){setPendingPlan(null);setFormMessage(beforeSigning.reason);return;}
    setBusy(true);setFormMessage('');
    try {
      const result=await signAndBroadcastPayment({manager,plan:pendingPlan,hostOverride:host,onSigned:()=>setFormMessage('Wallet signed the reviewed transaction. Broadcasting now.'),validateBeforeBroadcast:()=>{const latest=evaluate(formatSatoshis(pendingPlan.amountSats),pendingPlan.recipient);return latest.allowed?null:latest.reason;}});
      setReceipt(result);setActivity(current=>[result,...current]);setPendingPlan(null);setFormMessage('Broadcast accepted by the verified BCH network provider.');
    } catch(error){setFormMessage(error instanceof Error?error.message:String(error));}
    finally{setBusy(false);}
  }

  async function copyText(label:string,value:string) {
    try { await navigator.clipboard.writeText(value);setCopied(label);window.setTimeout(()=>setCopied(''),1500); }
    catch { setFormMessage('Clipboard access is unavailable. Select the text and copy it manually.'); }
  }

  const qrVisible=!!wallet.uri&&!!wallet.qrUri&&pairingOpen;
  const decision=evaluate();
  const sendBlocked=!connected||providerState!=='online'||(network==='mainnet'&&!projectConfig.mainnetSendsEnabled)||!policyCreated||!projectConfig.demoRecipient||!projectConfig.demoAmountBch||busy;

  return <div className="app-shell">
    <aside className="blaze-banner" aria-label="BCH BLAZE project links"><div className="blaze-banner-label"><span className="status-dot online"/>BCH BLAZE 2026</div><div className="blaze-banner-links">{projectConfig.deckUrl?<a href={projectConfig.deckUrl} target="_blank" rel="noreferrer">Widget Factory deck</a>:<><a href="https://docs.google.com/presentation/d/1Yfuk9CJkf4U9M_WukcELhumWgj3Ak6345Ewy8hSp-Hk/edit?slide=id.p#slide=id.p" target="_blank" rel="noreferrer">Widget Factory template</a><span>Project deck pending</span></>}<a href={projectConfig.repositoryUrl} target="_blank" rel="noreferrer">Source</a><span className="banner-address">EMBER2026: {projectConfig.donationAddress||'Address pending team verification'}</span></div></aside>
    <header className={'topbar '+(compactNav?'topbar-compact':'')}>
      <a className="wordmark" href="#top" aria-label="Pact home">pact</a>
      <nav className="desktop-nav" aria-label="Main navigation"><a href="#rules">Policy</a><a href="#activity">Activity</a><a href="#how-it-works">How it works</a></nav><details className="mobile-nav"><summary aria-label="Open navigation">Menu</summary><div className="mobile-menu-links"><a href="#rules">Policy</a><a href="#activity">Activity</a><a href="#how-it-works">How it works</a></div></details>
      <div className="topbar-actions">
        <label className="network-select"><span className={'status-dot '+(providerState==='online'?'online':providerState==='offline'?'offline':'')}/><span className="sr-only">Network</span><select value={network} onChange={event=>{setNetwork(event.target.value as 'mainnet'|'chipnet');setPolicyCreated(false);setPendingPlan(null);}}><option value="chipnet">Chipnet</option><option value="mainnet">Mainnet</option></select><span className="chevron">v</span></label>
        {connected?<button className="wallet-pill connected-pill" onClick={()=>wallet.disconnect()}><span className="status-dot online"/>{wallet.walletName||'Wallet connected'}<span className="disconnect-mark">x</span></button>:<button className="button button-small button-outline" onClick={()=>{setPairingOpen(true);wallet.connect();}}>Connect wallet</button>}
      </div>
    </header>

    <main id="top">
      <section className="hero-wrap">
        <div className="hero-grid">
          <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/>BITCOIN CASH / AGENT PAYMENTS</div><h1>Set the limits.<br/><span>Keep the keys.</span></h1><p className="hero-description">Give an agent a BCH spending cap, an approved recipient, and an expiry. Pact makes the boundary and payment result visible.</p><div className="hero-actions"><a className="button button-primary" href="#rules">Create a spending rule</a><a className="text-link" href="#payment">Try the payment demo</a></div></div>
        </div>
        <div className="hero-bottom"><span>BUILT FOR BITCOIN CASH</span><span className="hero-bottom-line"/><span>HUMAN APPROVAL STAYS IN THE LOOP</span><span className="hero-bottom-right">01 / 04</span></div>
      </section>

      <section className="workspace-section section-pad" id="workspace">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>THE CONTROL ROOM</div><h2>Your spending workspace</h2><p>Set one rule, review one payment, keep control of every signature.</p></div><div className="provider-indicator"><span className={'status-dot '+(providerState==='online'?'online':providerState==='offline'?'offline':'')}/><span>{providerState==='online'?'BCH NETWORK READY':providerState==='checking'?'CHECKING NETWORK':'NETWORK UNAVAILABLE'}</span><span className="provider-network">{networkName}</span></div></div>
        {releaseIssues.length>0&&<div className="setup-banner"><div className="setup-icon" aria-hidden="true">i</div><div><strong>Submission setup is incomplete</strong><span>{releaseIssues.length} project detail{releaseIssues.length===1?'':'s'} still need the owner's verified values. The app can run without them.</span></div><a href="#release-checklist">View checklist <span aria-hidden="true">-&gt;</span></a></div>}
        {wallet.error&&<div className="inline-alert error-alert" role="alert">{wallet.error}</div>}
        {providerState==='offline'&&<div className="inline-alert error-alert" role="status"><span>{providerError||'Unable to reach a BCH provider.'}</span><button className="retry-button" type="button" onClick={()=>setProviderRetry(value=>value+1)}>Retry connection</button></div>}
        <div className="workspace-grid">
          <article className="panel rule-panel" id="rules"><div className="panel-head"><div><span className="panel-kicker">01 / SPENDING RULE</span><h3>Set the boundary</h3></div><span className={'state-chip '+(policyCreated?'state-live':'state-draft')}><span className="status-dot"/>{policyCreated?'ACTIVE IN THIS SESSION':'NOT SET'}</span></div><p className="panel-intro">One approved recipient, a maximum per payment, and an expiry. This rule is checked in the app before a payment is prepared.</p>
            <form onSubmit={savePolicy} className="stack-form"><label className="field-label" htmlFor="policy-recipient">Approved recipient <span className="field-hint">ONE ADDRESS</span></label><div className="input-wrap"><input id="policy-recipient" value={policyRecipient} onChange={event=>{setPolicyRecipient(event.target.value);setPolicyCreated(false);}} placeholder={network==='chipnet'?'bchtest:...':'bitcoincash:...'} autoComplete="off" spellCheck={false}/><button type="button" className="input-action" aria-label="Copy recipient address" onClick={()=>copyText('address',policyRecipient)} disabled={!policyRecipient}>{copied==='address'?'Copied':'Copy'}</button></div>
              <div className="field-row"><div className="field-block"><label className="field-label" htmlFor="cap">Per-payment cap <span className="field-hint">BCH</span></label><div className="input-wrap amount-wrap"><input id="cap" inputMode="decimal" value={cap} onChange={event=>{setCap(event.target.value);setPolicyCreated(false);}} placeholder="0.00"/><span className="input-suffix">BCH</span></div></div><div className="field-block"><label className="field-label" htmlFor="expiry">Rule expires</label><input className="text-input" id="expiry" type="datetime-local" value={expiry} onChange={event=>{setExpiry(event.target.value);setPolicyCreated(false);}}/></div></div>
              <div className="rule-note"><span className="note-lock">!</span><span>App-level check only. This does not enforce cumulative spend or expiry on-chain.</span></div><button type="submit" className="button button-secondary full-button">Save spending rule <span aria-hidden="true">-&gt;</span></button></form></article>

          <article className="panel payment-panel" id="payment"><div className="panel-head"><div><span className="panel-kicker">02 / PAYMENT REVIEW</span><h3>Prepare a payment</h3></div><span className="review-label"><span className="review-ring"/>REVIEW REQUIRED</span></div><p className="panel-intro">A matching proposal prepares a transaction for your wallet. Nothing is signed until you approve it there.</p>
            <form onSubmit={reviewPayment} className="stack-form"><div className="field-row payment-amount-row"><div className="field-block"><label className="field-label" htmlFor="pay-amount">Amount <span className="field-hint">BCH</span></label><div className="input-wrap amount-wrap"><input id="pay-amount" inputMode="decimal" value={amount} onChange={event=>{setAmount(event.target.value);setPendingPlan(null);setReceipt(null);}} placeholder="0.00"/><span className="input-suffix">BCH</span></div></div><div className="amount-cap"><span>YOUR CAP</span><strong>{policyCreated&&parseBchAmount(cap)!==null?cap:'--'} <small>BCH</small></strong></div></div><label className="field-label" htmlFor="pay-recipient">Recipient</label><input className="text-input" id="pay-recipient" value={recipient} onChange={event=>{setRecipient(event.target.value);setPendingPlan(null);setReceipt(null);}} placeholder="Enter the approved address" autoComplete="off" spellCheck={false}/><div className="payment-verdict"><span className={'verdict-indicator '+(decision.allowed?'verdict-ok':'')}/><span>{decision.allowed?'Matches the active spending rule':policyCreated?decision.reason:'Save a spending rule to enable payment checks'}</span><span className="verdict-ui">APP CHECK</span></div><button type="submit" className="button button-primary full-button" disabled={sendBlocked}>{busy?'Preparing...':'Review transaction'} <span aria-hidden="true">-&gt;</span></button><p className="microcopy">Wallet approval is required for every payment. Confirm the full address and fee in your wallet.</p></form>
            {formMessage&&<div className="form-message" role="status">{formMessage}</div>}
            {receipt&&<div className="receipt-card" role="status"><span className="receipt-check">OK</span><div><strong>Payment broadcast</strong><a href={receipt.explorerUrl} target="_blank" rel="noreferrer">{shortAddress(receipt.txid)} <span aria-hidden="true">-&gt;</span></a></div></div>}
          </article>

          <article className="panel agent-panel"><div className="agent-top"><div><span className="panel-kicker">03 / AGENT INTERFACE</span><h3>Propose, then pause.</h3></div><span className="agent-status">READY FOR INTEGRATION</span></div><p className="panel-intro">Your agent can ask Pact to check a proposal. The call returns a decision and never signs or broadcasts.</p><div className="code-card"><div className="code-top"><span><i/><i/><i/></span><span>YOUR APP / JAVASCRIPT</span><button type="button" onClick={()=>copyText('code',"window.pact.proposePayment({ amountBch: requestedAmountBch, recipient: approvedRecipient })")}>{copied==='code'?'COPIED':'COPY'}</button></div><pre><code><span className="code-muted">// Checks the active rule in this browser</span>{'\n'}<span className="code-purple">const</span> decision = window.pact.<span className="code-green">proposePayment</span>({'{'}{'\n'}  amountBch: <span className="code-yellow">requestedAmountBch</span>,{'\n'}  recipient: <span className="code-yellow">approvedRecipient</span>{'\n'}{'}'});{'\n'}<span className="code-purple">if</span> (decision.allowed) {'{'}{'\n'}  <span className="code-muted">// User reviews and approves separately</span>{'\n'}{'}'}</code></pre></div><div className="agent-foot"><span><span className="mini-shield">U</span> Human approval required</span><span>NO AUTO-SIGNING</span></div></article>

          <article className="panel activity-panel" id="activity"><div className="panel-head"><div><span className="panel-kicker">04 / PAYMENT HISTORY</span><h3>Recent activity</h3></div><span className="activity-count">{activity.length.toString().padStart(2,'0')}</span></div><div className="activity-list">{activity.length===0?<div className="empty-activity"><span className="empty-icon">--</span><strong>No payments yet</strong><p>Successful broadcasts in this session will appear here.</p></div>:activity.map(item=><div className="activity-item" key={item.txid}><span className="activity-symbol">B</span><div className="activity-detail"><strong>Payment sent</strong><a href={item.explorerUrl} target="_blank" rel="noreferrer">{shortAddress(item.txid)}</a></div><div className="activity-amount"><strong>{formatSatoshis(item.amountSats)} BCH</strong><span>{item.network==='mainnet'?'Mainnet':'Chipnet'}</span></div></div>)}</div><div className="activity-foot"><span>Only broadcasts from this browser session</span><span>VERIFIED TXIDS</span></div></article>
        </div>
      </section>

      <section className="boundary-section section-pad" id="policy-boundary"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>POLICY BOUNDARY</div><h2>What Pact checks</h2><p>Client-side checks explain the rule before signing. The current XO template does not enforce these conditions on-chain.</p></div><span className="section-index">UI-ONLY</span></div><div className="boundary-register"><div className="boundary-row"><strong>Per-payment cap</strong><span>Checks the amount for this proposal. It does not track cumulative spending.</span><span className="boundary-status">App check only</span></div><div className="boundary-row"><strong>Approved recipient</strong><span>Compares BCH locking bytecode for the proposed and approved addresses.</span><span className="boundary-status">App check only</span></div><div className="boundary-row"><strong>Expiry</strong><span>Stops new proposals after the selected browser time. No on-chain expiry or reclaim path is implemented.</span><span className="boundary-status">App check only</span></div></div></section>
      <section className="guided-section section-pad" id="how-it-works"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>GUIDED PAYMENT</div><h2>Review each step before signing.</h2><p>The wallet remains the final approval point for every transaction.</p></div><span className="section-index">BCH / {networkName}</span></div><div className="guided-grid"><div className="guided-instructions"><div className="guided-step"><span>01</span><p>Connect a WizardConnect-compatible BCH wallet and check its network.</p></div><div className="guided-step"><span>02</span><p>Set the recipient, per-payment cap, and expiry in the spending rule.</p></div><div className="guided-step"><span>03</span><p>Review the amount, full address, fee estimate, and network in Pact.</p></div><div className="guided-step"><span>04</span><p>Approve the exact transaction in your wallet. Pact broadcasts only the signed transaction.</p></div></div><div className="guided-summary"><div><span>NETWORK PROVIDER</span><strong>{networkName} / {providerState==='online'?'connected':providerState==='checking'?'checking':'unavailable'}</strong></div><div><span>WALLET</span><strong>{connected?(wallet.walletName||'Connected'):'Not connected'}</strong></div><div><span>POLICY STATE</span><strong>{policyCreated?'UI rule active for this session':'No active rule'}</strong></div><p>Provider availability and wallet connection do not mean a transaction is confirmed. A real transaction ID appears only after the network provider accepts the broadcast.</p></div></div></section>
      <section className="integrations-section section-pad" id="integrations"><div className="integration-copy"><div className="eyebrow"><span className="eyebrow-line"/>CONNECTED WITH CARE</div><h2>Wallet keys stay<br/><span>with your wallet.</span></h2><p>Pact pairs through WizardConnect. It requests public addresses and a signature for a reviewed transaction. The app does not ask for a seed phrase.</p><a className="text-link" href="https://docs.riftenlabs.com/wizardconnect/react/" target="_blank" rel="noreferrer">WizardConnect integration <span aria-hidden="true">-&gt;</span></a></div><div className="integration-card"><div className="integration-card-head"><span>LIVE CONNECTION</span><span className="live-led"/></div><div className="integration-logos"><div className="integration-logo pact-mini"><i/><i/><i/><i/></div><span className="integration-linkline"/><div className="integration-logo wallet-logo">W</div><span className="integration-linkline"/><div className="integration-logo chain-logo">B</div></div><div className="integration-names"><span>Pact</span><span>WizardConnect</span><span>Bitcoin Cash</span></div><div className="integration-details"><div><span>PAIRING</span><strong>Ephemeral session</strong></div><div><span>NETWORK</span><strong>{networkName}</strong></div><div><span>APPROVAL</span><strong>Every transaction</strong></div></div><div className="integration-security"><span>+</span><p>Public keys for address discovery. Your wallet signs only after you review.</p></div></div></section>

      <section className="token-section section-pad" id="token"><div className="token-panel"><div className="token-copy"><div className="eyebrow"><span className="eyebrow-line"/>COMMUNITY TOKEN</div><h2>EMBER2026</h2><p>Token details appear here after the team verifies its CashTokens address. Pact does not invent a token address or imply an on-chain allocation.</p><div className="token-address">{projectConfig.donationAddress||'Address pending team verification'}</div></div><div className="token-aside"><span>STATUS</span><strong>{projectConfig.donationAddress?'ADDRESS CONFIGURED':'PENDING'}</strong><span className="token-aside-line"/><small>VERIFY ON CHIPNET FIRST</small></div></div></section>

      <section className="submission-section section-pad" id="release-checklist"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>BEFORE SUBMISSION</div><h2>Make the demo verifiable.</h2><p>Fill only confirmed values. Keep proof links with the release notes.</p></div><span className="section-index">03 / CHECKLIST</span></div><div className="checklist-grid">{[['Project deck','Add the final Widget Factory deck URL to VITE_PROJECT_DECK_URL.',!!projectConfig.deckUrl],['EMBER2026 address','Verify the CashTokens address with the team and set it in .env.',false],['Demo payment','Use an owner-approved Chipnet recipient and amount in .env.',!!projectConfig.demoRecipient&&!!projectConfig.demoAmountBch],['XO proof','Validate the actual Pact template and publish a Chipnet invitation with tx evidence.',false],['Live demo','Deploy the app and capture a verified demo after Chipnet review.',false],['Event roll call','Post the project link and demo proof to the BLAZE roll call and community.',false]].map(([title,detail,done])=><div className="checklist-row" key={String(title)}><span className={'checklist-check '+(done?'done':'')}>{done?'OK':'-'}</span><div><strong>{title}</strong><span>{detail}</span></div><span className={'checklist-state '+(done?'done':'')}>{done?'CONFIGURED':'PENDING'}</span></div>)}</div></section>
    </main>
    <footer className="footer"><a className="wordmark" href="#top">pact</a><span>APP-LEVEL POLICY CHECKS, WIZARDCONNECT SIGNING, AND REAL BCH TRANSACTIONS</span><div><a href={projectConfig.repositoryUrl} target="_blank" rel="noreferrer">GitHub</a><a href="https://bchblaze.cash/" target="_blank" rel="noreferrer">BCH BLAZE</a><span>BUILT FOR REVIEW</span></div></footer>
    <dialog ref={reviewDialog} className="review-dialog" aria-labelledby="review-title" onCancel={()=>setPendingPlan(null)}>{pendingPlan&&<><div className="review-card-head"><strong id="review-title">Confirm this payment</strong><span>NOT BROADCAST</span></div><div className="review-line"><span>Network</span><strong>{pendingPlan.network==='mainnet'?'Bitcoin Cash Mainnet':'BCH Chipnet'}</strong></div><div className="review-line"><span>Recipient</span><strong className="address-full">{pendingPlan.recipient}</strong></div><div className="review-line"><span>Payment amount</span><strong>{formatSatoshis(pendingPlan.amountSats)} BCH</strong></div><div className="review-line"><span>Estimated network fee</span><strong>{formatSatoshis(pendingPlan.feeSats)} BCH</strong></div><div className="review-actions"><button type="button" className="button button-outline" onClick={()=>setPendingPlan(null)}>Cancel</button><button type="button" className="button button-primary" onClick={approveAndBroadcast} disabled={busy}>{busy?'Waiting for wallet...':'Open wallet to approve'}</button></div></>}</dialog>
    {qrVisible&&<WizardConnectQRDialog show={qrVisible} uri={wallet.uri!} qrUri={wallet.qrUri!} onClose={()=>setPairingOpen(false)} title="Connect your BCH wallet" subtitle="Scan with a WizardConnect compatible wallet" theme={{dialogBackground:'#151D1A',headerBackground:'#101715',titleColor:'#F2F5F1',subtitleColor:'#A6B2AA',borderColor:'rgba(229,242,234,.16)',qrForeground:'#0B0F0E',qrBackground:'#F2F5F1'}}/>}
    {wallet.state==='connecting'&&<div className="wallet-connecting" role="status"><span className="spinner"/>Waiting for wallet connection</div>}
  </div>;
}
