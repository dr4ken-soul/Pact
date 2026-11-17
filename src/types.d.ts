interface PactIntent { amountBch:string; recipient:string; }
interface PactIntentDecision { allowed:boolean; reason:string; }
interface Window { pact?:{ proposePayment:(intent:PactIntent)=>PactIntentDecision }; }
