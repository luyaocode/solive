// items.ts

interface Item {
  name: string;
  cname: string;
  info: string;
  isUsed: boolean;
  before: boolean;
  do(): void;
  beforeUse(): void;
}

export class Sword implements Item {
  name: string = 'sword';
  cname: string = '大剑';
  info: string = '攻击范围：1；可以击破护盾';
  isUsed: boolean;
  before: boolean = false;

  constructor(name: string = 'sword', isUsed: boolean = false) {
    this.name = name;
    this.isUsed = isUsed;
  }

  do() {
    console.log(`${this.name} is being used!`);
    this.isUsed = true;
  }

  beforeUse() {
    this.before = true;
  }

  swing() {
    console.log(`${this.name} is swung!`);
  }
}

export class Shield implements Item {
  name: string = 'shield';
  cname: string = '大盾';
  info: string = '攻击范围：0；免疫弓箭、药水等';
  isUsed: boolean;
  before: boolean = false;

  constructor(name: string = 'shield', isUsed: boolean = false) {
    this.name = name;
    this.isUsed = isUsed;
  }

  do() {
    console.log(`${this.name} is being used!`);
    this.isUsed = true;

  }
  beforeUse() {
    this.before = true;
  }

  block() {
    console.log(`${this.name} is blocking!`);
  }
}

export class Bow implements Item {
  name: string = 'bow';
  cname: string = '弓箭';
  info: string = '攻击范围：1.5';
  isUsed: boolean;
  before: boolean = false;

  constructor(name: string = 'bow', isUsed: boolean = false) {
    this.name = name;
    this.isUsed = isUsed;
  }

  do() {
    console.log(`${this.name} is being used!`);
    this.isUsed = true;

  }
  beforeUse() {
    this.before = true;
  }

  shoot() {
    console.log(`${this.name} is shooting!`);
  }
}

interface Bomb extends Item {

}

interface Flower extends Item {
  growthTime: number;
}

interface Potion extends Item {
}

interface Spell extends Item {

}

export class InfectPotion implements Potion {
  name: string = 'infectPotion';
  cname: string = '侵蚀药水';
  info: string = '攻击范围：1；可将敌方单位变成己方单位';
  isUsed: boolean;
  before: boolean = false;

  constructor(name: string = 'infectPotion', isUsed: boolean = false) {
    this.name = name;
    this.isUsed = isUsed;
  }

  do() {
    console.log(`${this.name} is being used!`);
    this.isUsed = true;

  }
  beforeUse() {
    this.before = true;
  }
}

export class TimeBomb implements Bomb {
  name: string = 'timeBomb';
  cname: string = '定时炸弹';
  info: string = '攻击范围：2；生成一个己方棋子，1回合之后炸毁范围内所有单位；可放置于空白区域，不能放置于相邻炸弹旁边';
  isUsed: boolean;
  before: boolean = false;
  liveTime: number = 2;

  constructor(name: string = 'timeBomb', isUsed: boolean = false) {
    this.name = name;
    this.isUsed = isUsed;
  }

  do() {
    console.log(`${this.name} is being used!`);
    this.isUsed = true;

  }
  beforeUse() {
    this.before = true;
  }
}

export class XFlower implements Flower {
  name: string = 'xFlower';
  cname: string = '花朵-X型';
  info: string = '攻击范围：0；放置一颗种子，3回合之后长成一朵花；可放置于任意空白区域';
  isUsed: boolean;
  before: boolean = false;
  growthTime: number = 5;

  constructor(name: string = 'xFlower', isUsed: boolean = false) {
    this.name = name;
    this.isUsed = isUsed;
  }

  do() {
    console.log(`${this.name} is being used!`);
    this.isUsed = true;

  }
  beforeUse() {
    this.before = true;
  }
}

export class FreezeSpell implements Spell {
  name: string = 'freezeSpell';
  cname: string = '冻结术';
  info: string = '攻击范围：1.5；冻结范围内敌方单位，持有护盾单位除外';
  isUsed: boolean;
  before: boolean = false;
  duration: number = 10;

  constructor(name: string = '冻结术', isUsed: boolean = false) {
    this.name = name;
    this.isUsed = isUsed;
  }

  do() {
    console.log(`${this.name} is being used!`);
    this.isUsed = true;

  }
  beforeUse() {
    this.before = true;
  }
}

