let avatars = {};
let avatarsLoaded = false;
fetch("data/avatars.json")
  .then(r => r.json())
  .then(data => { avatars = data; avatarsLoaded = true; });
const itemNames={
    weapon:{
        common:['Rusty Sword','Wooden Club','Simple Dagger'],
        rare:['Steel Blade','Enchanted Bow','Warhammer'],
        epic:['Dragon Slayer','Arcane Staff','Shadow Blade']
    },
    armor:{
        common:['Leather Armor','Wooden Shield','Cloth Robe'],
        rare:['Chainmail','Iron Shield','Mage Cloak'],
        epic:['Dragon Scale','Blessed Aegis','Shadow Garb']
    },
    artifact:{
        common:['Minor Talisman','Old Charm','Traveler\'s Stone'],
        rare:['Mystic Amulet','Guardian Rune','Sorcerer\'s Orb'],
        epic:['Phoenix Heart','Ancient Relic','Time Shard']
    }
};
const backgrounds={
    Knight:'knight-bg',
    Mage:'mage-bg',
    Rogue:'rogue-bg'
};
let players=[];
let current=0;
let defending=[false,false];
let defendMult=[1,1];
let stun=[0,0];
let poison=[0,0];
let cooldown=[0,0];
let cooldownBase=[3,3];
let coins=0;
let inventory={
    weapon:{common:[],rare:[],epic:[]},
    armor:{common:[],rare:[],epic:[]},
    artifact:{common:[],rare:[],epic:[]}
};
let xp=0;
let level=1;
let cpuCoins=0;
let battleNumber=1;
let isBoss=false;
const log=document.getElementById('log');
function logMsg(msg){log.innerHTML+=msg+'<br>';log.scrollTop=log.scrollHeight;}

loadProgress();
updateCoins();

function setButtons(enabled){
    document.getElementById('attack-btn').disabled=!enabled;
    document.getElementById('defend-btn').disabled=!enabled;
    document.getElementById('special-btn').disabled=!enabled;
}

function saveProgress(){
    localStorage.setItem('aaCoins', coins);
    localStorage.setItem('aaInv', JSON.stringify(inventory));
    localStorage.setItem('aaXP', xp);
    localStorage.setItem('aaLevel', level);
}

function loadProgress(){
    const saved=localStorage.getItem('aaCoins');
    if(saved) coins=parseInt(saved);
    const savedXP=localStorage.getItem('aaXP');
    if(savedXP) xp=parseInt(savedXP);
    const savedLvl=localStorage.getItem('aaLevel');
    if(savedLvl) level=parseInt(savedLvl);
    const inv=localStorage.getItem('aaInv');
    if(inv){
        const data=JSON.parse(inv);
        if(Array.isArray(data.weapon?.common)){
            inventory=data;
        }else{
            inventory={
                weapon:{common:Array(data.weapon).fill('Common Weapon'),rare:[],epic:[]},
                armor:{common:Array(data.armor).fill('Common Armor'),rare:[],epic:[]},
                artifact:{common:Array(data.artifact).fill('Common Artifact'),rare:[],epic:[]}
            };
        }
    }
}

function updateCoins(){
    document.getElementById('coins').textContent=coins;
    const el=document.getElementById('coins-loadout');
    if(el) el.textContent=coins;
    const lvl=document.getElementById('level');
    const xpEl=document.getElementById('xp');
    if(lvl) lvl.textContent=level;
    if(xpEl) xpEl.textContent=xp;
    saveProgress();
    updateInventoryUI();
}

function updateInventoryUI(){
    const w=document.getElementById('inv-weapon');
    const a=document.getElementById('inv-armor');
    const t=document.getElementById('inv-artifact');
    if(w) w.textContent=`Common:${inventory.weapon.common.length} `
        + `Rare:${inventory.weapon.rare.length} `
        + `Epic:${inventory.weapon.epic.length}`;
    if(a) a.textContent=`Common:${inventory.armor.common.length} `
        + `Rare:${inventory.armor.rare.length} `
        + `Epic:${inventory.armor.epic.length}`;
    if(t) t.textContent=`Common:${inventory.artifact.common.length} `
        + `Rare:${inventory.artifact.rare.length} `
        + `Epic:${inventory.artifact.epic.length}`;
}

function updateEquipInfo(){
    if(players.length){
        const info=`Weapons: ${players[0].weapons}/${players[0].slots.weapon} `
        + `Armor: ${players[0].armor}/${players[0].slots.armor} `
        + `Artifacts: ${players[0].artifacts}/${players[0].slots.artifact}`;
        document.getElementById('equip-info').textContent=info;
        const el=document.getElementById('equip-info-loadout');
        if(el) el.textContent=info;
    }
}

function updateLoadout(){
    if(document.getElementById('loadout-stats')){
        document.getElementById('loadout-stats').textContent=
        `HP: ${players[0].maxHp} ATK: ${players[0].atk} DEF: ${players[0].def} EN: ${players[0].energy}/${players[0].maxEnergy}`;
    }
}

document.querySelectorAll('.avatar-list button').forEach(btn=>{
    btn.addEventListener('click',()=>{
        if(!avatarsLoaded){
            alert('Avatars are still loading. Please try again.');
            return;
        }
        const avatar=btn.dataset.avatar;
        const data=avatars[avatar];
        if(!data) return;
        players[0]={
            ...data,
            name:`Player (${data.emoji} ${avatar})`,
            maxHp:data.hp,
            maxEnergy:data.energy,
            energy:data.energy,
            weapons:0,armor:0,artifacts:0,slots:data.slots
        };
        document.body.className=backgrounds[avatar]||'';
        showLoadout();
    });
});

function showLoadout(){
    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('loadout-screen').classList.remove('hidden');
    document.getElementById('loadout-name').textContent=players[0].name;
    document.getElementById('loadout-model').textContent=players[0].emoji;
    document.getElementById('loadout-stats').textContent=`HP: ${players[0].maxHp} ATK: ${players[0].atk} DEF: ${players[0].def}`;
    document.getElementById('lore').textContent=players[0].lore;
    updateCoins();
    updateEquipInfo();
    updateLoadout();
    updateInventoryUI();
}

function startBattle(){
    document.getElementById('loadout-screen').classList.add('hidden');
    document.getElementById('shop-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    document.getElementById('battle-screen').classList.remove('hidden');
    const keys=Object.keys(avatars);
    const enemyKey=keys[Math.floor(Math.random()*keys.length)];
    players[1]={
        ...avatars[enemyKey],
        name:`CPU (${avatars[enemyKey].emoji} ${enemyKey})`,
        maxHp:avatars[enemyKey].hp,
        maxEnergy:avatars[enemyKey].energy,
        energy:avatars[enemyKey].energy,
        weapons:0,armor:0,artifacts:0,slots:avatars[enemyKey].slots
    };
    if(isBoss){
        players[1].maxHp=Math.round(players[1].maxHp*2);
        players[1].atk=Math.round(players[1].atk*1.5);
        players[1].def=Math.round(players[1].def*1.5);
        players[1].maxEnergy+=20;
        isBoss=false;
    }
    players[0].hp=players[0].maxHp;
    players[1].hp=players[1].maxHp;
    players[0].energy=players[0].maxEnergy;
    players[1].energy=players[1].maxEnergy;
    current=0;
    defending=[false,false];
    defendMult=[1,1];
    stun=[0,0];
    poison=[0,0];
    cooldown=[0,0];
    cooldownBase=[3,3];
    log.innerHTML='';
    updateUI();
    updateCoins();
    updateEquipInfo();
    logMsg(`Battle ${battleNumber} Start!`);
    updateTurn();
}

function updateUI(){
    for(let i=0;i<2;i++){
        document.getElementById('p'+(i+1)+'-name').textContent=players[i].name;
        document.getElementById('p'+(i+1)+'-model').textContent=players[i].emoji;
        document.getElementById('p'+(i+1)+'-stats').textContent=`HP: ${Math.max(0,players[i].hp)}/${players[i].maxHp} ATK: ${players[i].atk} DEF: ${players[i].def} EN: ${players[i].energy}/${players[i].maxEnergy}`;
        document.getElementById('p'+(i+1)+'-equip').textContent=
            `Weapons: ${players[i].weapons}/${players[i].slots.weapon} `
            + `Armor: ${players[i].armor}/${players[i].slots.armor} `
            + `Artifacts: ${players[i].artifacts}/${players[i].slots.artifact}`;
        const ratio=Math.max(0,players[i].hp)/players[i].maxHp*100;
        const bar=document.getElementById('p'+(i+1)+'-health');
        bar.style.width=ratio+'%';
        bar.style.background=ratio>50?'#4caf50':ratio>20?'#ffeb3b':'#f44336';
        const eratio=Math.max(0,players[i].energy)/players[i].maxEnergy*100;
        const ebar=document.getElementById('p'+(i+1)+'-energy');
        if(ebar) ebar.style.width=eratio+'%';
    }
    updateEquipInfo();
}

function endTurn(){
    for(let i=0;i<2;i++){
        if(poison[i]>0){
            players[i].hp-=5;
            poison[i]--;
            logMsg(`${players[i].name} takes 5 poison damage.`);
        }
    }
    for(let i=0;i<2;i++){
        players[i].energy=Math.min(players[i].maxEnergy,players[i].energy+10);
    }
    current=1-current;
    defending[current]=false;
    defendMult[current]=1;
    if(cooldown[current]>0)cooldown[current]--;
    updateUI();
    checkVictory();
    updateTurn();
}

function cpuAction(){
    if(cooldown[current]==0 && players[current].energy>=players[current].cost && Math.random()<0.5){
        special();
    }else if(Math.random()<0.6){
        attack();
    }else{
        defend();
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
        setTimeout(cpuAction,500);
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
    if(cooldown[current]>0){
        logMsg(`Special on cooldown: ${cooldown[current]} turn(s) left.`);
        return;
    }
    const attacker=players[current];
    if(attacker.energy<attacker.cost){
        logMsg('Not enough energy.');
        return;
    }
    attacker.energy-=attacker.cost;
    const defender=players[1-current];
    if(Math.random()<0.05){
        logMsg(`${defender.name} dodged the special attack!`);
        cooldown[current]=cooldownBase[current];
        defending[current]=false;
        endTurn();
        return;
    }
    const name=attacker.name;
    if(name.includes('Knight')){
        let defense=defender.def;
        let dmg=Math.max(10,Math.round(attacker.atk - defense/2));
        if(defending[1-current]){
            dmg=Math.round(dmg*defendMult[1-current]);
        }
        if(Math.random()<0.15){dmg*=2;logMsg('Critical hit!');}
        defender.hp-=dmg;
        stun[1-current]=1;
        logMsg(`${attacker.name} uses Shield Bash for ${dmg} damage! Enemy stunned.`);
    }else if(name.includes('Mage')){
        if(Math.random()<0.7){
            let defense=defender.def;
            let dmg=Math.max(10,Math.round(attacker.atk*2 - defense/2));
            if(defending[1-current]){
                dmg=Math.round(dmg*defendMult[1-current]);
            }
            if(Math.random()<0.15){dmg*=2;logMsg('Critical hit!');}
            defender.hp-=dmg;
            logMsg(`${attacker.name} casts Fireball for ${dmg} damage.`);
        }else{
            logMsg(`${attacker.name}'s Fireball missed!`);
        }
    }else{
        let defense=defender.def;
        let dmg=Math.max(10,Math.round(attacker.atk*1.5 - defense/2));
        if(defending[1-current]){
            dmg=Math.round(dmg*defendMult[1-current]);
        }
        if(Math.random()<0.15){dmg*=2;logMsg('Critical hit!');}
        defender.hp-=dmg;
        poison[1-current]=3;
        logMsg(`${attacker.name} uses Poison Dagger for ${dmg} damage. Enemy poisoned!`);
    }
    cooldown[current]=cooldownBase[current];
    defending[current]=false;
    endTurn();
}

function checkVictory(){
    if(players[0].hp<=0||players[1].hp<=0){
        document.getElementById('battle-screen').classList.add('hidden');
        document.getElementById('victory-screen').classList.remove('hidden');
        document.getElementById('winner').textContent=`${players[0].hp<=0?players[1].name:players[0].name} Wins!`;
        const playerWon=players[1].hp<=0;
        if(playerWon){
            coins+=20;
            cpuCoins+=10;
            logMsg('You earned 20 coins!');
            tryLoot();
            addXP(50);
            document.getElementById('next-btn').classList.remove('hidden');
            showConfetti();
        }else{
            coins+=10;
            cpuCoins+=20;
            logMsg('You earned 10 coins.');
            document.getElementById('next-btn').classList.add('hidden');
        }
        updateCoins();
        updateEquipInfo();
    }
}

function nextBattle(){
    battleNumber++;
    document.getElementById('next-btn').classList.add('hidden');
    startBattle();
}

function equipWeapon(){
    if(players[0].weapons>=players[0].slots.weapon){
        logMsg('No weapon slots left.');
        return;
    }
    let rarity='';
    let name='';
    if(inventory.weapon.epic.length){
        name=inventory.weapon.epic.pop(); rarity='epic'; players[0].atk+=4;
    }else if(inventory.weapon.rare.length){
        name=inventory.weapon.rare.pop(); rarity='rare'; players[0].atk+=3;
    }else if(inventory.weapon.common.length){
        name=inventory.weapon.common.pop(); rarity='common'; players[0].atk+=2;
    }
    if(rarity){
        players[0].weapons++;
        logMsg(`Equipped ${name}.`);
        updateCoins();
        updateUI();
        updateEquipInfo();
        updateLoadout();
    }else{
        logMsg('No weapons in inventory.');
    }
}

function equipArmor(){
    if(players[0].armor>=players[0].slots.armor){
        logMsg('No armor slots left.');
        return;
    }
    let rarity='';
    let name='';
    if(inventory.armor.epic.length){
        name=inventory.armor.epic.pop(); rarity='epic'; players[0].def+=4;
    }else if(inventory.armor.rare.length){
        name=inventory.armor.rare.pop(); rarity='rare'; players[0].def+=3;
    }else if(inventory.armor.common.length){
        name=inventory.armor.common.pop(); rarity='common'; players[0].def+=2;
    }
    if(rarity){
        players[0].armor++;
        logMsg(`Equipped ${name}.`);
        updateCoins();
        updateUI();
        updateEquipInfo();
        updateLoadout();
    }else{
        logMsg('No armor in inventory.');
    }
}

function equipArtifact(){
    if(players[0].artifacts>=players[0].slots.artifact){
        logMsg('No artifact slots left.');
        return;
    }
    let rarity='';
    let name='';
    if(inventory.artifact.epic.length){
        name=inventory.artifact.epic.pop(); rarity='epic'; cooldownBase[0]=Math.max(1,cooldownBase[0]-3); players[0].maxHp+=30; players[0].maxEnergy+=15; players[0].energy=players[0].maxEnergy;
    }else if(inventory.artifact.rare.length){
        name=inventory.artifact.rare.pop(); rarity='rare'; cooldownBase[0]=Math.max(1,cooldownBase[0]-2); players[0].maxHp+=20; players[0].maxEnergy+=10; players[0].energy=players[0].maxEnergy;
    }else if(inventory.artifact.common.length){
        name=inventory.artifact.common.pop(); rarity='common'; cooldownBase[0]=Math.max(1,cooldownBase[0]-1); players[0].maxHp+=10; players[0].maxEnergy+=5; players[0].energy=players[0].maxEnergy;
    }
    if(rarity){
        players[0].artifacts++;
        logMsg(`Equipped ${name}.`);
        updateCoins();
        updateEquipInfo();
        updateLoadout();
        updateUI();
    }else{
        logMsg('No artifacts in inventory.');
    }
}

function randomRarity(){
    const r=Math.random();
    if(r<0.1) return 'epic';
    if(r<0.4) return 'rare';
    return 'common';
}

function randomItemName(type,rarity){
    const arr=itemNames[type][rarity];
    return arr[Math.floor(Math.random()*arr.length)];
}

function previewItem(type){
    const r=randomRarity();
    document.getElementById('preview').textContent=`${randomItemName(type,r)} (${r})`;
}

function clearPreview(){
    document.getElementById('preview').textContent='';
}

function buyWeapon(){
    if(coins>=10){
        coins-=10;
        const r=randomRarity();
        const name=randomItemName('weapon',r);
        inventory.weapon[r].push(name);
        logMsg(`Bought ${name} (${r}).`);
        updateCoins();
    }else{
        logMsg('Not enough coins.');
    }
}

function buyArmor(){
    if(coins>=10){
        coins-=10;
        const r=randomRarity();
        const name=randomItemName('armor',r);
        inventory.armor[r].push(name);
        logMsg(`Bought ${name} (${r}).`);
        updateCoins();
    }else{
        logMsg('Not enough coins.');
    }
}

function buyArtifact(){
    if(coins>=20){
        coins-=20;
        const r=randomRarity();
        const name=randomItemName('artifact',r);
        inventory.artifact[r].push(name);
        logMsg(`Bought ${name} (${r}).`);
        updateCoins();
    }else{
        logMsg('Not enough coins.');
    }
}

function giveRandomLoot(){
    const typeRoll=Math.random();
    const rarity=randomRarity();
    if(typeRoll<0.33){
        const name=randomItemName('weapon',rarity);
        inventory.weapon[rarity].push(name);
        logMsg(`Found ${name}!`);
    }else if(typeRoll<0.66){
        const name=randomItemName('armor',rarity);
        inventory.armor[rarity].push(name);
        logMsg(`Found ${name}!`);
    }else{
        const name=randomItemName('artifact',rarity);
        inventory.artifact[rarity].push(name);
        logMsg(`Found ${name}!`);
    }
    updateCoins();
}

function tryLoot(){
    if(Math.random()<0.3){
        giveRandomLoot();
    }else{
        logMsg('No drops this time.');
    }
}

function addXP(amount){
    xp+=amount;
    const needed=level*100;
    if(xp>=needed){
        xp-=needed;
        level++;
        players[0].maxHp+=10;
        players[0].maxEnergy+=5;
        logMsg(`Level up! Now level ${level}.`);
    }
    updateCoins();
}

function closeShop(){
    document.getElementById('shop-screen').classList.add('hidden');
}

function goBack(){
    document.getElementById('loadout-screen').classList.add('hidden');
    document.getElementById('selection-screen').classList.remove('hidden');
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

document.getElementById('attack-btn').onclick=attack;
document.getElementById('defend-btn').onclick=defend;
document.getElementById('special-btn').onclick=special;
document.getElementById('start-btn').onclick=startBattle;
document.getElementById('next-btn').onclick=nextBattle;
document.getElementById('shop-btn').onclick=()=>{
    document.getElementById('shop-screen').classList.toggle('hidden');
};
document.getElementById('back-btn').onclick=goBack;
document.getElementById('boss-btn').onclick=startBossBattle;
document.getElementById('buy-weapon-btn').addEventListener('mouseenter',()=>previewItem('weapon'));
document.getElementById('buy-weapon-btn').addEventListener('mouseleave',clearPreview);
document.getElementById('buy-armor-btn').addEventListener('mouseenter',()=>previewItem('armor'));
document.getElementById('buy-armor-btn').addEventListener('mouseleave',clearPreview);
document.getElementById('buy-artifact-btn').addEventListener('mouseenter',()=>previewItem('artifact'));
document.getElementById('buy-artifact-btn').addEventListener('mouseleave',clearPreview);
