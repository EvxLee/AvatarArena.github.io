let avatars = {};
let avatarsLoaded = false;
fetch("data/avatars.json")
  .then(r => r.json())
  .then(data => { avatars = data; avatarsLoaded = true; });
let itemNames = {};
let itemsLoaded = false;
fetch("data/items.json")
  .then(r => r.json())
  .then(data => { itemNames = data; itemsLoaded = true; });
const backgrounds={
    Knight:'knight-bg',
    Mage:'mage-bg',
    Rogue:'rogue-bg'
};
const nextPurchase={weapon:null,armor:null,artifact:null};
let shopStock={weapon:null,armor:null,artifact:null};
function colorName(name,rarity){
    return `<span class="rarity-${rarity}">${name}</span>`;
}
let players=[];
let current=0;
let defending=[false,false];
let defendMult=[1,1];
let stun=[0,0];
let poison=[0,0];
let cooldown=[0,0];
let cooldownBase=[3,3];
let cpuPlannedAction=null;
let cpuDefendMsg='';
let coins=0;
let inventory={
    weapon:{common:[],rare:[],epic:[],legendary:[]},
    armor:{common:[],rare:[],epic:[],legendary:[]},
    artifact:{common:[],rare:[],epic:[],legendary:[]}
};
let xp=0;
let level=0;
let xpData={Knight:{xp:0,level:0},Mage:{xp:0,level:0},Rogue:{xp:0,level:0}};
let currentAvatar=null;
let cpuCoins=0;
let battleNumber=1;
let isBoss=false;
let currentBattleIsBoss=false;
let lastRewardCoins=0;
let lastLootMsg='';
const log=document.getElementById('log');
function logMsg(msg){log.innerHTML+=msg+'<br>';log.scrollTop=log.scrollHeight;}

loadProgress();
updateCoins();

function refreshShopItem(type){
    const r=randomRarity();
    shopStock[type]={name:randomItemName(type,r),rarity:r};
}

function resetShop(){
    for(const type of ['weapon','armor','artifact']){
        refreshShopItem(type);
    }
}

function setButtons(enabled){
    document.getElementById('attack-btn').disabled=!enabled;
    document.getElementById('defend-btn').disabled=!enabled;
    document.getElementById('special-btn').disabled=!enabled;
}

function chooseCpuAction(){
    const idx=1;
    defending[idx]=false;
    defendMult[idx]=1;
    const canSpecial = cooldown[idx]===0 && players[idx].energy>=players[idx].maxEnergy*0.5;
    const roll=Math.random();
    if(canSpecial){
        if(roll<0.4) cpuPlannedAction='attack';
        else if(roll<0.8) cpuPlannedAction='defend';
        else cpuPlannedAction='special';
    }else{
        cpuPlannedAction = roll<0.6 ? 'attack' : 'defend';
    }
    if(cpuPlannedAction==='defend'){
        const r=Math.random();
        if(r<0.02){cpuDefendMsg=`${players[idx].name} prepares a perfect block!`;defendMult[idx]=0;}
        else if(r<0.10){cpuDefendMsg=`${players[idx].name} braces to block 75% damage.`;defendMult[idx]=0.25;}
        else if(r<0.35){cpuDefendMsg=`${players[idx].name} braces to block 50% damage.`;defendMult[idx]=0.5;}
        else{cpuDefendMsg=`${players[idx].name} braces to block 25% damage.`;defendMult[idx]=0.75;}
        defending[idx]=true;
    }else{
        cpuDefendMsg='';
    }
}

function saveProgress(){
    localStorage.setItem('aaCoins', coins);
    localStorage.setItem('aaInv', JSON.stringify(inventory));
    localStorage.setItem('aaXPData', JSON.stringify(xpData));
}

function loadProgress(){
    const saved=localStorage.getItem('aaCoins');
    if(saved) coins=parseInt(saved);
    const xpStr=localStorage.getItem('aaXPData');
    if(xpStr){
        try{ xpData=JSON.parse(xpStr); }catch(e){}
    }
    for(const av of ['Knight','Mage','Rogue']){
        if(!xpData[av]) xpData[av]={xp:0,level:0};
    }
    const inv=localStorage.getItem('aaInv');
    if(inv){
        const data=JSON.parse(inv);
        if(Array.isArray(data.weapon?.common)){
            inventory=data;
        }else{
            inventory={
                weapon:{common:Array(data.weapon).fill('Common Weapon'),rare:[],epic:[],legendary:[]},
                armor:{common:Array(data.armor).fill('Common Armor'),rare:[],epic:[],legendary:[]},
                artifact:{common:Array(data.artifact).fill('Common Artifact'),rare:[],epic:[],legendary:[]}
            };
        }
    }
}

function showBack(){ document.getElementById('menu-back').classList.remove('hidden'); }
function hideBack(){ document.getElementById('menu-back').classList.add('hidden'); }

function updateEquipInfo(){
    const p=players[0];
    document.getElementById('equip-info-loadout').innerHTML=
        `ATK: ${p.atk} / DEF: ${p.def}<br>`+
        `Weapons: ${p.equipment.weapon.join(', ')||'None'}<br>`+
        `Armor: ${p.equipment.armor.join(', ')||'None'}<br>`+
        `Artifacts: ${p.equipment.artifact.join(', ')||'None'}`;
}

function updateLoadout(){
    document.getElementById('loadout-name').textContent=players[0].name;
    document.getElementById('loadout-model').textContent=players[0].img;
    document.getElementById('loadout-stats').textContent=`HP ${players[0].hp}/${players[0].maxHp} | EN ${players[0].energy}/${players[0].maxEnergy}`;
    document.getElementById('level').textContent=level;
    document.getElementById('xp').textContent=xp;
}

function updateUI(){
    document.body.className=backgrounds[currentAvatar]||'';
    document.getElementById('p1-name').textContent=players[0].name;
    document.getElementById('p1-model').textContent=players[0].img;
    document.getElementById('p1-stats').textContent=`ATK ${players[0].atk} / DEF ${players[0].def}`;
    document.getElementById('p1-equip').innerHTML=
        `Weapons: ${players[0].equipment.weapon.join(', ')||'None'}<br>`+
        `Armor: ${players[0].equipment.armor.join(', ')||'None'}<br>`+
        `Artifacts: ${players[0].equipment.artifact.join(', ')||'None'}`;
    document.getElementById('p2-name').textContent=players[1].name;
    document.getElementById('p2-model').textContent=players[1].img;
    document.getElementById('p2-stats').textContent=`ATK ${players[1].atk} / DEF ${players[1].def}`;
    document.getElementById('p2-equip').innerHTML=
        `Weapons: ${players[1].equipment.weapon.join(', ')||'None'}<br>`+
        `Armor: ${players[1].equipment.armor.join(', ')||'None'}<br>`+
        `Artifacts: ${players[1].equipment.artifact.join(', ')||'None'}`;
}

function updateCoins(){
    document.getElementById('coins-top').textContent=coins;
}

function createPlayer(name,img){
    return{
        name,
        img,
        hp:100,
        maxHp:100,
        atk:20,
        def:10,
        energy:50,
        maxEnergy:50,
        equipment:{weapon:[],armor:[],artifact:[]},
        slots:{weapon:2,armor:2,artifact:1}
    };
}

function selectAvatar(name){
    if(!avatarsLoaded) return;
    currentAvatar=name;
    const data=avatars[name];
    players[0]=createPlayer(data.name,data.img);
    ({xp,level}=xpData[name]);
    updateLoadout();
    updateEquipInfo();
    updateCoins();
    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('loadout-screen').classList.remove('hidden');
    showBack();
}

document.querySelectorAll('.avatar-option button').forEach(btn=>{
    btn.addEventListener('click',()=>selectAvatar(btn.dataset.avatar));
});

function startBattle(){
    if(!avatarsLoaded||!itemsLoaded) return;
    players[1]=createPlayer('CPU',avatars.Knight.img);
    players[1].atk=15+Math.floor(battleNumber*2);
    players[1].def=10+Math.floor(battleNumber*1.5);
    players[1].hp=100+battleNumber*10;
    players[1].maxHp=players[1].hp;
    players[1].energy=50;
    players[1].maxEnergy=50;
    players[1].img=avatars[battleNumber%3===0?'Rogue':battleNumber%2===0?'Mage':'Knight'].img;
    players[1].equipment={weapon:['Basic Sword'],armor:['Cloth'],artifact:[]};
    players[0].hp=players[0].maxHp;
    players[0].energy=players[0].maxEnergy;
    cooldown=[0,0];
    stun=[0,0];
    poison=[0,0];
    defending=[false,false];
    battleNumber++;
    current=0;
    currentBattleIsBoss=isBoss;
    document.getElementById('battle-screen').classList.remove('hidden');
    document.getElementById('loadout-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    document.getElementById('defeat-screen').classList.add('hidden');
    showBack();
    updateUI();
    updateHealthBars();
    log.innerHTML='';
    updateTurn();
}

function updateHealthBars(){
    document.getElementById('p1-health').style.width=Math.max(0,players[0].hp/players[0].maxHp*100)+'%';
    document.getElementById('p1-energy').style.width=Math.max(0,players[0].energy/players[0].maxEnergy*100)+'%';
    document.getElementById('p2-health').style.width=Math.max(0,players[1].hp/players[1].maxHp*100)+'%';
    document.getElementById('p2-energy').style.width=Math.max(0,players[1].energy/players[1].maxEnergy*100)+'%';
}

function endTurn(){
    current=1-current;
    updateHealthBars();
    updateTurn();
}

function cpuAction(){
    if(cpuPlannedAction==='defend'){
        logMsg(cpuDefendMsg);
        cpuPlannedAction=null;
        endTurn();
    }else if(cpuPlannedAction==='special'){
        cpuPlannedAction=null;
        special();
    }else{ // attack by default
        cpuPlannedAction=null;
        attack();
    }
}

function updateTurn(){
    document.getElementById('turn-indicator').textContent=`${players[current].name}'s Turn`;
    setButtons(current===0);
    if(stun[current]>0){
        logMsg(`${players[current].name} is stunned and skips a turn.`);
        stun[current]--;
        endTurn();
        return;
    }
    if(current===1){
        chooseCpuAction();
        cpuAction();
    }
}

function attack(){
    const attacker=players[current];
    const defender=players[1-current];
    if(Math.random()<0.05){
        logMsg(`${defender.name} dodged the attack!`);
        defending[current]=false;
        endTurn();
        return;
    }
    let defense=defender.def;
    let dmg=Math.max(10,Math.round(attacker.atk - defense/2));
    if(defending[1-current]){
        dmg=Math.round(dmg*defendMult[1-current]);
    }
    let crit=false;
    if(Math.random()<0.15){
        dmg*=2;
        crit=true;
    }
    defender.hp-=dmg;
    logMsg(`${attacker.name} attacks for ${dmg} damage.${crit?' Critical hit!':''}`);
    if(checkVictory()) return;
    defending[current]=false;
    endTurn();
}

function defend(){
    defending[current]=true;
    const roll=Math.random();
    if(roll<0.02){
        defendMult[current]=0;
        logMsg(`${players[current].name} prepares a perfect block!`);
    }else if(roll<0.10){
        defendMult[current]=0.25;
        logMsg(`${players[current].name} braces to block 75% damage.`);
    }else if(roll<0.35){
        defendMult[current]=0.5;
        logMsg(`${players[current].name} braces to block 50% damage.`);
    }else{
        defendMult[current]=0.75;
        logMsg(`${players[current].name} braces to block 25% damage.`);
    }
    endTurn();
}

function special(){
    const attacker=players[current];
    const defender=players[1-current];
    if(cooldown[current]>0 || attacker.energy<attacker.maxEnergy*0.5){
        logMsg(`${attacker.name} tried to use a special move but failed.`);
        endTurn();
        return;
    }
    const name=attacker.name;
    if(name.includes('Knight')){
        let defense=defender.def;
        let dmg=Math.max(15,Math.round(attacker.atk*1.5 - defense/2));
        if(defending[1-current]){
            dmg=Math.round(dmg*defendMult[1-current]);
        }
        if(Math.random()<0.2){dmg*=2;logMsg('Critical hit!');}
        defender.hp-=dmg;
        logMsg(`${attacker.name} unleashes Power Strike for ${dmg} damage.`);
        if(checkVictory()) { cooldown[current]=cooldownBase[current]; defending[current]=false; return; }
    }else if(name.includes('Mage')){
        if(Math.random()<0.8){
            let defense=defender.def;
            let dmg=Math.max(20,Math.round(attacker.atk*1.8 - defense/2));
            if(defending[1-current]){
                dmg=Math.round(dmg*defendMult[1-current]);
            }
            if(Math.random()<0.15){dmg*=2;logMsg('Critical hit!');}
            defender.hp-=dmg;
            logMsg(`${attacker.name} casts Fireball for ${dmg} damage.`);
            if(checkVictory()) { cooldown[current]=cooldownBase[current]; defending[current]=false; return; }
        }else{
            logMsg(`${attacker.name}'s Fireball missed!`);
        }
    }else if(name.includes('Rogue')){
        let defense=defender.def;
        let dmg=Math.max(10,Math.round(attacker.atk - defense/2));
        if(defending[1-current]){
            dmg=Math.round(dmg*defendMult[1-current]);
        }
        if(Math.random()<0.15){dmg*=2;logMsg('Critical hit!');}
        defender.hp-=dmg;
        poison[1-current]=3;
        logMsg(`${attacker.name} uses Poison Dagger for ${dmg} damage. Enemy poisoned!`);
        if(checkVictory()) { cooldown[current]=cooldownBase[current]; defending[current]=false; return; }
    }
    cooldown[current]=cooldownBase[current];
    defending[current]=false;
    endTurn();
}

function checkVictory(){
    if(players[0].hp<=0 || players[1].hp<=0){
        document.getElementById('battle-screen').classList.add('hidden');
        hideBack();
        const playerWon = players[1].hp<=0;
        if(playerWon){
            document.getElementById('victory-screen').classList.remove('hidden');
            document.getElementById('defeat-screen').classList.add('hidden');
            document.getElementById('winner').textContent=`${players[0].name} Wins!`;
            const reward=currentBattleIsBoss?20:10;
            lastRewardCoins=reward;
            coins+=reward;
            cpuCoins+=10;
            logMsg(`You earned ${reward} coins!`);
            lastLootMsg=tryLoot();
            document.getElementById('victory-img').src=players[0].img;
            document.getElementById('victory-reward').textContent=`+${reward} coins. ${lastLootMsg}`;
            addXP(50);
            document.getElementById('next-btn').classList.remove('hidden');
            showConfetti();
        }else{
            document.getElementById('victory-screen').classList.add('hidden');
            document.getElementById('defeat-screen').classList.remove('hidden');
            document.getElementById('loser').textContent=`Defeated by ${players[1].name}`;
            lastRewardCoins=5;
            coins+=5;
            cpuCoins+=20;
            lastLootMsg='';
            logMsg('You earned 5 coins.');
            document.getElementById('defeat-img').src=players[1].img;
            document.getElementById('defeat-reward').textContent=`+5 coins.`;
            document.getElementById('next-btn').classList.add('hidden');
        }
        updateCoins();
        updateEquipInfo();
        currentBattleIsBoss=false;
        return true;
    }
    return false;
}

function nextBattle(){
    battleNumber++;
    document.getElementById('next-btn').classList.add('hidden');
    startBattle();
}

function equipWeapon(){
    if(players[0].equipment.weapon.length>=players[0].slots.weapon){
        logMsg('No weapon slots left.');
        return;
    }
    const rarity=randomRarity();
    const name=randomItemName('weapon',rarity);
    players[0].equipment.weapon.push(name);
    inventory.weapon[rarity].push(name);
    players[0].atk+=rarity==='legendary'?8:rarity==='epic'?6:rarity==='rare'?4:2;
    logMsg(`Equipped ${colorName(name,rarity)}.`);
    updateCoins();
    updateEquipInfo();
    updateLoadout();
    updateUI();
}
function equipArmor(){
    if(players[0].equipment.armor.length>=players[0].slots.armor){
        logMsg('No armor slots left.');
        return;
    }
    const rarity=randomRarity();
    const name=randomItemName('armor',rarity);
    players[0].equipment.armor.push(name);
    inventory.armor[rarity].push(name);
    players[0].def+=rarity==='legendary'?8:rarity==='epic'?6:rarity==='rare'?4:2;
    logMsg(`Equipped ${colorName(name,rarity)}.`);
    updateCoins();
    updateEquipInfo();
    updateLoadout();
    updateUI();
}
function equipArtifact(){
    if(players[0].equipment.artifact.length>=players[0].slots.artifact){
        logMsg('No artifact slots left.');
        return;
    }
    const rarity=randomRarity();
    const name=randomItemName('artifact',rarity);
    players[0].equipment.artifact.push(name);
    inventory.artifact[rarity].push(name);
    if(rarity==='legendary'){cooldownBase[0]=Math.max(1,cooldownBase[0]-4);players[0].maxHp+=40;players[0].maxEnergy+=20;}
    else if(rarity==='epic'){cooldownBase[0]=Math.max(1,cooldownBase[0]-3);players[0].maxHp+=30;players[0].maxEnergy+=15;}
    else if(rarity==='rare'){cooldownBase[0]=Math.max(1,cooldownBase[0]-2);players[0].maxHp+=20;players[0].maxEnergy+=10;}
    else {cooldownBase[0]=Math.max(1,cooldownBase[0]-1);players[0].maxHp+=10;players[0].maxEnergy+=5;}
    players[0].energy=players[0].maxEnergy;
    logMsg(`Equipped ${colorName(name,rarity)}.`);
    updateCoins();
    updateEquipInfo();
    updateLoadout();
    updateUI();
}

function randomRarity(){
    const roll=Math.random();
    if(roll<0.5) return 'common';
    if(roll<0.8) return 'rare';
    if(roll<0.95) return 'epic';
    return 'legendary';
}

function randomItemName(type,rarity){
    const list=itemNames[type]?.[rarity]||[];
    if(!list.length) return 'Unknown';
    return list[Math.floor(Math.random()*list.length)];
}

function purchase(type,cost){
    if(coins>=cost){
        coins-=cost;
        const {name,rarity}=shopStock[type];
        inventory[type][rarity].push(name);
        logMsg(`Purchased ${colorName(name,rarity)}.`);
        refreshShopItem(type);
        nextPurchase[type]=null;
        document.getElementById(`buy-${type}-btn`).removeAttribute('title');
        document.getElementById('preview').textContent='';
        updateCoins();
    }else{
        logMsg('Not enough coins.');
    }
}

function buyWeapon(){ purchase('weapon',10); }
function buyArmor(){ purchase('armor',10); }
function buyArtifact(){ purchase('artifact',20); }

function giveRandomLoot(){
    const typeRoll=Math.random();
    const rarity=randomRarity();
    let msg='';
    if(typeRoll<0.33){
        const name=randomItemName('weapon',rarity);
        inventory.weapon[rarity].push(name);
        msg=`Found ${name} (${rarity.charAt(0).toUpperCase()+rarity.slice(1)})!`;
        logMsg(colorName(msg,rarity));
    }else if(typeRoll<0.66){
        const name=randomItemName('armor',rarity);
        inventory.armor[rarity].push(name);
        msg=`Found ${name} (${rarity.charAt(0).toUpperCase()+rarity.slice(1)})!`;
        logMsg(colorName(msg,rarity));
    }else{
        const name=randomItemName('artifact',rarity);
        inventory.artifact[rarity].push(name);
        msg=`Found ${name} (${rarity.charAt(0).toUpperCase()+rarity.slice(1)})!`;
        logMsg(colorName(msg,rarity));
    }
    updateCoins();
    return msg;
}

function tryLoot(){
    if(Math.random()<0.3){
        return giveRandomLoot();
    }else{
        const msg='No drops this time.';
        logMsg(msg);
        return msg;
    }
}

function addXP(amount){
    xp+=amount;
    while(xp>=100){
        xp-=100;
        level++;
        players[0].atk+=1;
        players[0].def+=1;
        players[0].maxHp+=5;
        players[0].hp+=5;
        logMsg(`Level up! Now level ${level}.`);
    }
    xpData[currentAvatar]={xp,level};
    updateCoins();
    updateLoadout();
    updateUI();
}

function closeShop(){
    document.getElementById('shop-screen').classList.add('hidden');
}

function showCustom(){
    document.getElementById('loadout-screen').classList.add('hidden');
    document.getElementById('custom-screen').classList.remove('hidden');
    showBack();
    populateCustom();
}

function hideCustom(){
    document.getElementById('custom-screen').classList.add('hidden');
    document.getElementById('loadout-screen').classList.remove('hidden');
}

function populateCustom(){
    const p=players[0];
    const findRarity=(n)=>{
        for(const cat of Object.values(itemNames)){
            for(const r in cat){
                if(cat[r].includes(n)) return r;
            }
        }
        return 'common';
    };
    const colorize=(name)=>colorName(name,findRarity(name));
    document.getElementById('weapon-list').innerHTML=p.equipment.weapon.map(colorize).join(', ')||'None';
    document.getElementById('armor-list').innerHTML=p.equipment.armor.map(colorize).join(', ')||'None';
    document.getElementById('artifact-list').innerHTML=p.equipment.artifact.map(colorize).join(', ')||'None';

    const wSel=document.getElementById('weapon-select');
    const aSel=document.getElementById('armor-select');
    const tSel=document.getElementById('artifact-select');
    const fill=(sel,arr)=>{ sel.innerHTML=''; arr.forEach(n=>{const o=document.createElement('option');o.textContent=n;sel.appendChild(o);}); };
    fill(wSel,[...inventory.weapon.common,...inventory.weapon.rare,...inventory.weapon.epic,...inventory.weapon.legendary]);
    fill(aSel,[...inventory.armor.common,...inventory.armor.rare,...inventory.armor.epic,...inventory.armor.legendary]);
    fill(tSel,[...inventory.artifact.common,...inventory.artifact.rare,...inventory.artifact.epic,...inventory.artifact.legendary]);
}

function equipSelected(type){
    const sel=document.getElementById(type+'-select');
    const name=sel.value;
    if(!name) return;
    const inv=inventory[type];
    let rarity='';
    for(const r of ['legendary','epic','rare','common']){
        const idx=inv[r].indexOf(name);
        if(idx>-1){inv[r].splice(idx,1);rarity=r;break;}
    }
    if(!rarity){return;}
    const p=players[0];
    if(p.equipment[type].length>=p.slots[type]){logMsg('No '+type+' slots left.'); return;}
    p.equipment[type].push(name);
    if(type==='weapon'){
        p.atk+=rarity==='legendary'?8:rarity==='epic'?6:rarity==='rare'?4:2;
    }
    if(type==='armor'){
        p.def+=rarity==='legendary'?8:rarity==='epic'?6:rarity==='rare'?4:2;
    }
    if(type==='artifact'){
        if(rarity==='legendary'){cooldownBase[0]=Math.max(1,cooldownBase[0]-4);p.maxHp+=40;p.maxEnergy+=20;}
        else if(rarity==='epic'){cooldownBase[0]=Math.max(1,cooldownBase[0]-3);p.maxHp+=30;p.maxEnergy+=15;}
        else if(rarity==='rare'){cooldownBase[0]=Math.max(1,cooldownBase[0]-2);p.maxHp+=20;p.maxEnergy+=10;}
        else {cooldownBase[0]=Math.max(1,cooldownBase[0]-1);p.maxHp+=10;p.maxEnergy+=5;}
        p.energy=p.maxEnergy;
    }
    populateCustom();
    updateCoins();
    updateEquipInfo();
    updateLoadout();
    updateUI();
}

function goBack(){
    document.getElementById('loadout-screen').classList.add('hidden');
    document.getElementById('custom-screen').classList.add('hidden');
    document.getElementById('battle-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    document.getElementById('defeat-screen').classList.add('hidden');
    document.getElementById('selection-screen').classList.remove('hidden');
    hideBack();
}

function startBossBattle(){
    isBoss=true;
    startBattle();
}

function showConfetti(){
    for(let i=0;i<30;i++){
        const span=document.createElement('span');
        span.className='confetti';
        span.textContent='🎉';
        span.style.left=Math.random()*100+'vw';
        span.style.animationDelay=Math.random()*0.5+'s';
        document.body.appendChild(span);
        setTimeout(()=>span.remove(),1000);
    }
}

function previewItem(type){
    if(!itemsLoaded) return;
    const {name,rarity}=shopStock[type];
    nextPurchase[type]={name,rarity};
    document.getElementById(`buy-${type}-btn`).title=name;
    const rarityLabel=rarity.charAt(0).toUpperCase()+rarity.slice(1);
    document.getElementById('preview').innerHTML=colorName(`${name} (${rarityLabel})`,rarity);
}

function clearPreview(e){
    const id=e.currentTarget.id;
    const type=id.split('-')[1];
    nextPurchase[type]=null;
    e.currentTarget.removeAttribute('title');
    document.getElementById('preview').textContent='';
}

function playerAttack(){
    if(current!==0) {
        return;
    }
    attack();
}
function playerDefend(){
    if(current!==0) {
        return;
    }
    defend();
}
function playerSpecial(){
    if(current!==0) {
        return;
    }
    special();
}

document.getElementById('attack-btn').addEventListener('click',playerAttack);
document.getElementById('defend-btn').addEventListener('click',playerDefend);
document.getElementById('special-btn').addEventListener('click',playerSpecial);
document.getElementById('start-btn').addEventListener('click',startBattle);
document.getElementById('next-btn').addEventListener('click',nextBattle);
document.getElementById('shop-btn').addEventListener('click',()=>{
    document.getElementById('shop-screen').classList.toggle('hidden');
});
document.getElementById('menu-back').addEventListener('click',goBack);
document.getElementById('boss-btn').addEventListener('click',startBossBattle);
document.getElementById('custom-btn').addEventListener('click',showCustom);
document.getElementById('custom-back').addEventListener('click',hideCustom);
document.getElementById('equip-sel-weapon').addEventListener('click',()=>equipSelected('weapon'));
document.getElementById('equip-sel-armor').addEventListener('click',()=>equipSelected('armor'));
document.getElementById('equip-sel-artifact').addEventListener('click',()=>equipSelected('artifact'));
document.getElementById('buy-weapon-btn').addEventListener('mouseenter',()=>previewItem('weapon'));
document.getElementById('buy-weapon-btn').addEventListener('mouseleave',clearPreview);
document.getElementById('buy-armor-btn').addEventListener('mouseenter',()=>previewItem('armor'));
document.getElementById('buy-armor-btn').addEventListener('mouseleave',clearPreview);
document.getElementById('buy-artifact-btn').addEventListener('mouseenter',()=>previewItem('artifact'));
document.getElementById('buy-artifact-btn').addEventListener('mouseleave',clearPreview);
