// Exercise the real browser handler with a controlled external API boundary.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function page({ok=true,success=true,networkError=false,analyticsError=false,timeoutSupported=true, tracking=true, native=false}={}){
 const events=[],requests=[];const handlers = {}; const links = ["#contact", "/#contact", "tel:+15550100", "mailto:test@example.com", "https://example.com/#contact", "#work"].map(href => ({getAttribute:()=>href, addEventListener:(event,handler)=>{linksByHref[href]=handler;}}));
 const linksByHref = {};
 const fields={source_page:{value:''},service:{value:'Local SEO'},botcheck:{checked:false}};
 const button={disabled:false,textContent:'Send inquiry'};
 const status={textContent:'',setAttribute(){},focus(){}};
 const form={action:'https://api.web3forms.com/submit',checkValidity:()=>true,reportValidity(){},querySelector:s=>s==='button[type="submit"]'?button:s==='[role="status"]'?status:null,elements:{namedItem:n=>fields[n]},addEventListener:(n,fn)=>{handlers[n]=fn;},reset(){this.resets=(this.resets||0)+1;},setAttribute(){},removeAttribute(){}};
 const context={document:{querySelectorAll:s=>s.startsWith('input')?[fields.source_page]:s.startsWith('form')?[form]:links},URL, location:{origin:'https://localwebcraft.com',href:'https://localwebcraft.com/web-design-cleveland-tn.html',pathname:'/web-design-cleveland-tn.html'},FormData:class {constructor(){this.data={name:'Test Person',email:'test@example.com',message:'PRIVATE TEST',service:'Local SEO'};} entries(){return Object.entries(this.data)[Symbol.iterator]();}},AbortSignal:timeoutSupported?AbortSignal:{},fetch:native?undefined:async(url,opts)=>{requests.push({url,opts});if(networkError)throw Error('offline');return {ok,json:async()=>({success,message:'API response'})};},gtag:tracking?(...args)=>{events.push(args);if(analyticsError)throw Error('analytics blocked');}:undefined};
 vm.runInNewContext(fs.readFileSync('webcraft.js','utf8'),context);
 return {form,fields,button,status,events,requests,handlers,linksByHref, names:()=>events.map(e=>e[1]), send:async()=>handlers.submit({preventDefault(){}})};
}
test('one accepted inquiry produces one event without personal data',async()=>{const p=page();await p.send();assert.equal(p.requests.length,1);assert.deepEqual(p.names(),['webcraft_form_start','webcraft_form_attempt','webcraft_inquiry_received']);assert.equal(p.events.at(-1)[2].page_path,'/web-design-cleveland-tn.html');assert.equal(p.events.at(-1)[2].service_interest,'local_seo');assert.equal(p.form.resets,1);assert.equal(p.button.disabled,false);assert.doesNotMatch(JSON.stringify(p.events),/Test Person|test@example|PRIVATE TEST/);assert.match(p.status.textContent,/received/i);});
for(const options of [{ok:false},{success:false},{networkError:true}])test('failure retains input and never records a conversion '+JSON.stringify(options),async()=>{const p=page(options);await p.send();assert.deepEqual(p.names(),['webcraft_form_start','webcraft_form_attempt','webcraft_form_delivery_error']);assert.equal(p.form.resets,undefined);assert.equal(p.button.disabled,false);assert.match(p.status.textContent,/email|received|send/i);});
test('concurrent submit is ignored while the first request runs',async()=>{const p=page();await Promise.all([p.send(),p.send()]);assert.equal(p.requests.length,1);assert.equal(p.names().filter(name=>name==='webcraft_inquiry_received').length,1);});
test('honeypot entries are not sent or counted',async()=>{const p=page();p.fields.botcheck.checked=true;await p.send();assert.equal(p.requests.length,0);assert.equal(p.events.length,0);});
test('analytics failure does not turn an accepted inquiry into a form failure',async()=>{const p=page({analyticsError:true});await p.send();assert.equal(p.requests.length,1);assert.equal(p.form.resets,1);assert.match(p.status.textContent,/received/i);});

test('browsers without AbortSignal.timeout can still send inquiries',async()=>{const p=page({timeoutSupported:false});await p.send();assert.equal(p.requests.length,1);assert.equal(p.form.resets,1);assert.match(p.status.textContent,/received/i);});

test('form activity counts first input and each known invalid field once per draft', async () => {
  const p = page();
  p.handlers.input({target:{name:'email',value:'private@example.com'}});
  p.handlers.change({target:{name:'service',value:'Local SEO'}});
  for (const name of ['email','email','message','private@example.com']) {
    p.handlers.invalid({target:{name,value:'PRIVATE TEST'}});
  }
  await p.send();
  p.handlers.input({target:{name:'name'}});
  assert.deepEqual(p.names(),[
    'webcraft_form_start','webcraft_form_validation_error','webcraft_form_validation_error',
    'webcraft_form_attempt','webcraft_inquiry_received','webcraft_form_start'
  ]);
  assert.equal(p.events[1][2].field_name,'email');
  assert.equal(p.events[2][2].field_name,'message');
  assert.doesNotMatch(JSON.stringify(p.events),/private@example|PRIVATE TEST/);
});
test('unsupported service text never enters Analytics',async()=>{
  const p=page();
  p.fields.service.value='private@example.com';
  await p.send();
  assert.doesNotMatch(JSON.stringify(p.events),/private@example/);
  assert.equal(p.events.at(-1)[2].service_interest,undefined);
});
test('contact intent is distinct from confirmed leads',()=>{
  const p=page();
  for(const href of ['#contact','/#contact','tel:+15550100','mailto:test@example.com']) p.linksByHref[href]({});
  for(const href of ['https://example.com/#contact','#work']) assert.equal(p.linksByHref[href],undefined);
  assert.deepEqual(p.names(),['webcraft_contact_cta_click','webcraft_contact_cta_click','phone_click','email_click']);
  assert.doesNotMatch(JSON.stringify(p.events),/test@example|15550100/);
});
test('analytics opt-out does not stop inquiry delivery',async()=>{
  const p=page({tracking:false});
  await p.send();
  assert.equal(p.requests.length,1);
  assert.equal(p.events.length,0);
  assert.equal(p.form.resets,1);
});
test('native submission records intent and lets the browser deliver the form',async()=>{
  const p=page({native:true});
  let prevented=false;
  await p.handlers.submit({preventDefault(){prevented=true;}});
  assert.equal(prevented,false);
  assert.deepEqual(p.names(),['webcraft_form_start','webcraft_form_attempt']);
});
