// Exercise the real browser handler with a controlled external API boundary.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function page({ok=true,success=true,networkError=false,analyticsError=false,timeoutSupported=true}={}){
 const events=[],requests=[];let submit;
 const fields={source_page:{value:''},service:{value:'Local SEO'},botcheck:{checked:false}};
 const button={disabled:false,textContent:'Send inquiry'};
 const status={textContent:'',setAttribute(){},focus(){}};
 const form={action:'https://api.web3forms.com/submit',checkValidity:()=>true,reportValidity(){},querySelector:s=>s==='button[type="submit"]'?button:s==='[role="status"]'?status:null,elements:{namedItem:n=>fields[n]},addEventListener:(n,fn)=>{if(n==='submit')submit=fn;},reset(){this.resets=(this.resets||0)+1;},setAttribute(){},removeAttribute(){}};
 const context={document:{querySelectorAll:s=>s.startsWith('input')?[fields.source_page]:s.startsWith('form')?[form]:[]},location:{pathname:'/web-design-cleveland-tn.html'},FormData:class {constructor(){this.data={name:'Test Person',email:'test@example.com',message:'PRIVATE TEST',service:'Local SEO'};} entries(){return Object.entries(this.data)[Symbol.iterator]();}},AbortSignal:timeoutSupported?AbortSignal:{},fetch:async(url,opts)=>{requests.push({url,opts});if(networkError)throw Error('offline');return {ok,json:async()=>({success,message:'API response'})};},gtag:(...args)=>{events.push(args);if(analyticsError)throw Error('analytics blocked');}};
 vm.runInNewContext(fs.readFileSync('webcraft.js','utf8'),context);
 return {form,fields,button,status,events,requests,send:async()=>{assert.equal(typeof submit,'function','a confirmed-submission handler must exist');await submit({preventDefault(){}});}};
}
test('one accepted inquiry produces one event without personal data',async()=>{const p=page();await p.send();assert.equal(p.requests.length,1);assert.equal(p.events.length,1);assert.equal(p.events[0][1],'webcraft_inquiry_received');assert.equal(p.events[0][2].page_path,'/web-design-cleveland-tn.html');assert.equal(p.form.resets,1);assert.equal(p.button.disabled,false);assert.doesNotMatch(JSON.stringify(p.events),/Test Person|test@example|PRIVATE TEST/);assert.match(p.status.textContent,/received/i);});
for(const options of [{ok:false},{success:false},{networkError:true}])test('failure retains input and never records a conversion '+JSON.stringify(options),async()=>{const p=page(options);await p.send();assert.equal(p.events.length,0);assert.equal(p.form.resets,undefined);assert.equal(p.button.disabled,false);assert.match(p.status.textContent,/email|received|send/i);});
test('concurrent submit is ignored while the first request runs',async()=>{const p=page();await Promise.all([p.send(),p.send()]);assert.equal(p.requests.length,1);assert.equal(p.events.length,1);});
test('honeypot entries are not sent or counted',async()=>{const p=page();p.fields.botcheck.checked=true;await p.send();assert.equal(p.requests.length,0);assert.equal(p.events.length,0);});
test('analytics failure does not turn an accepted inquiry into a form failure',async()=>{const p=page({analyticsError:true});await p.send();assert.equal(p.requests.length,1);assert.equal(p.form.resets,1);assert.match(p.status.textContent,/received/i);});

test('browsers without AbortSignal.timeout can still send inquiries',async()=>{const p=page({timeoutSupported:false});await p.send();assert.equal(p.requests.length,1);assert.equal(p.form.resets,1);assert.match(p.status.textContent,/received/i);});
