const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function load({hostname='localwebcraft.com',protocol='https:',search='',staff=false,session={},blockedStorage=false}={}){
 const scripts=[];const window={};const localStorage={getItem(){if(blockedStorage)throw Error('blocked');return staff?'1':null;}};
 const sessionStorage={getItem:k=>session[k]||null,setItem:(k,v)=>session[k]=v,removeItem:k=>delete session[k]};
 const document={title:'WebCraft',referrer:'https://example.com/path?email=private@example.com#secret',createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}};
 const location={hostname,protocol,search,origin:protocol+'//'+hostname,pathname:'/web-design-cleveland-tn.html'};
 vm.runInNewContext(fs.readFileSync('webcraft-analytics.js','utf8'),{window,document,location,localStorage,sessionStorage,URL,URLSearchParams});
 return {window,scripts,events:(window.dataLayer||[]).map(a=>Array.from(a)),session};
}
for(const hostname of ['localhost','127.0.0.1','[::1]','preview.example.com','localwebcraft.com.evil.example'])test('does not load production analytics on '+hostname,()=>{let p=load({hostname});assert.equal(p.scripts.length,0);assert.equal(p.events.length,0);assert.equal(p.window.webcraftAnalyticsEnabled,false);});
test('production loads GA once and emits a sanitized page view',()=>{let p=load({search:'?email=private@example.com'});assert.equal(p.scripts.length,1);assert.match(p.scripts[0].src,/googletagmanager.com\/gtag\/js\?id=G-4GJ9T13HPP$/);assert.equal(p.events.filter(e=>e[1]==='page_view').length,1);assert.equal(p.events.find(e=>e[0]==='config')[2].send_page_view,false);assert.equal(p.events.find(e=>e[1]==='page_view')[2].page_referrer,'https://example.com/path');assert.doesNotMatch(JSON.stringify(p.events),/private@example|secret/);});
test('www production is supported but HTTP is not tracked',()=>{assert.equal(load({hostname:'www.localwebcraft.com'}).scripts.length,1);assert.equal(load({protocol:'http:'}).scripts.length,0);});
test('persistent staff opt-out suppresses all analytics',()=>{assert.equal(load({staff:true}).scripts.length,0);});
test('test mode persists within the tab and can be cleared',()=>{const session={};assert.equal(load({search:'?webcraft_test=1',session}).scripts.length,0);assert.equal(load({session}).scripts.length,0);assert.equal(load({search:'?webcraft_test=0',session}).scripts.length,1);});
test('blocked storage does not break normal production measurement',()=>{assert.equal(load({blockedStorage:true}).scripts.length,1);});
