import { Piece } from './Game.js'
// items.ts
interface Item {
  name: string;
  cname: string;
  info: string;
  isUsed: boolean;
  before: boolean;
  attackRange: number;
  srcPiece: Piece;
  tarPiece: Piece;
  do(): void;
  beforeUse(): void;
}

export class Sword implements Item {
  name: string = 'sword';
  cname: string = '大剑';
  info: string = '攻击范围：1；可以击破护盾';
  attackRange: number = 1;
  isUsed: boolean;
  before: boolean = false;
  srcPiece: Piece;
  tarPiece: Piece;
  constructor(name: string = 'sword', isUsed: boolean = false) {
    this.name = name;
    this.isUsed = isUsed;
  }

  do() {
    this.isUsed = true;
    this.before = false;
    let info: string;
    if (this.srcPiece.status.frozen) {
      info = this.srcPiece.type + ' 被冰冻，不能使用道具';
    }
    else if (this.tarPiece.status.frozen) {
      info = this.srcPiece.type + ' 使用了 ' + this.cname + '，敲碎了冰块';;
    }
    else if (this.srcPiece.type === this.tarPiece.type) {
      info = this.srcPiece.type + ' 使用了 ' + this.cname + '，但是没有目标';
    }
    else if (this.tarPiece.type === '') {
      info = this.srcPiece.type + ' 对地面使用了 ' + this.cname + '，但是没有效果';
    }
    else if (this.tarPiece.status.attachSeed) {
      info = this.srcPiece.type + ' 对对方花朵使用了 ' + this.cname + '，造成花朵凋亡';
    }
    else if (this.tarPiece.status.attachBomb) {
      info = this.srcPiece.type + ' 对对方炸弹使用了 ' + this.cname + '，炸弹爆炸';
    }
    else if (!this.tarPiece.canBeDestroyed) {
      info = this.srcPiece.type + ' 对 ' + this.tarPiece.type + ' 使用了 ' + this.cname + '，击破了护盾单位';
    }
    else {
      info = this.srcPiece.type + ' 对 ' + this.tarPiece.type + ' 使用了 ' + this.cname + '，击败了对方单位';
    }
    return info;
  }

  beforeUse() {
    this.before = true;
    this.isUsed = false;
  }
}

export class Shield implements Item {
  name: string = 'shield';
  cname: string = '大盾';
  info: string = '攻击范围：0；免疫弓箭、药水等';
  isUsed: boolean;
  before: boolean = false;
  attackRange: number = 0;
  srcPiece: Piece;
  tarPiece: Piece;
  constructor(name: string = 'shield', isUsed: boolean = false) {
    this.name = name;
    this.isUsed = isUsed;
  }

  do() {
    this.isUsed = true;
    this.before = false;
    const info = this.srcPiece.type + ' 使用了 ' + this.cname;
    return info;
  }
  beforeUse() {
    this.before = true;
  }
}

export class Bow implements Item {
  name: string = 'bow';
  cname: string = '弓箭';
  info: string = '攻击范围：1.5';
  isUsed: boolean;
  before: boolean = false;
  attackRange: number = 1.5;
  srcPiece: Piece;
  tarPiece: Piece;

  constructor(name: string = 'bow', isUsed: boolean = false) {
    this.name = name;
    this.isUsed = isUsed;
  }

  do() {
    this.before = false;
    this.isUsed = true;
    let info: string;
    if (this.srcPiece.status.frozen) {
      info = this.srcPiece.type + ' 被冰冻，不能使用道具';
    }
    else if (this.tarPiece.status.frozen) {
      info = this.srcPiece.type + ' 使用了 ' + this.cname + '，敲碎了冰块';;
    }
    else if (this.srcPiece.type === this.tarPiece.type) {
      info = this.srcPiece.type + ' 使用了 ' + this.cname + '，但是没有目标';
    }
    else if (this.tarPiece.type === '') {
      info = this.srcPiece.type + ' 对地面使用了 ' + this.cname + '，但是没有效果';
    }
    else if (this.tarPiece.status.attachSeed) {
      info = this.srcPiece.type + ' 对对方花朵使用了 ' + this.cname + '，造成花朵凋亡';
    }
    else if (this.tarPiece.status.attachBomb) {
      info = this.srcPiece.type + ' 对对方炸弹使用了 ' + this.cname + '，炸弹爆炸';
    }
    else if (!this.tarPiece.canBeDestroyed) {
      info = this.srcPiece.type + ' 对 ' + this.tarPiece.type + ' 使用了 ' + this.cname + '，未能击破护盾';
    }
    else {
      info = this.srcPiece.type + ' 对 ' + this.tarPiece.type + ' 使用了 ' + this.cname + '，击败了对方单位';
    }
    return info;
  }
  beforeUse() {
    this.before = true;
  }
}

interface Bomb extends Item {

}

interface Flower extends Item {
  growthTime: number;
}

interface Potion extends Item {
}

export interface Spell extends Item {
}

export class InfectPotion implements Potion {
  name: string = 'infectPotion';
  cname: string = '侵蚀药水';
  info: string = '攻击范围：1；可将敌方单位变成己方单位';
  isUsed: boolean;
  before: boolean = false;
  attackRange: number = 1;
  srcPiece: Piece;
  tarPiece: Piece;

  constructor(name: string = 'infectPotion', isUsed: boolean = false) {
    this.name = name;
    this.isUsed = isUsed;
  }

  do() {
    this.isUsed = true;
    this.before = false;
    let info: string;
    if (this.srcPiece.status.frozen) {
      info = this.srcPiece.type + ' 被冰冻，不能使用道具';
    }
    else if (this.srcPiece.type === this.tarPiece.type) {
      info = this.srcPiece.type + ' 使用了 ' + this.cname + '，但是没有目标';
    }
    else if (this.tarPiece.type === '') {
      info = this.srcPiece.type + ' 对地面使用了 ' + this.cname + '，但是没有效果';
    }
    else if (this.tarPiece.status.attachSeed) {
      info = this.srcPiece.type + ' 对对方花朵使用了 ' + this.cname + '，造成花朵凋亡';
    }
    else if (this.tarPiece.status.attachBomb) {
      info = this.srcPiece.type + ' 对对方炸弹使用了 ' + this.cname + '，炸弹爆炸';
    }
    else if (!this.tarPiece.canBeInfected) {
      info = this.srcPiece.type + ' 对 ' + this.tarPiece.type + ' 使用了 ' + this.cname + '，但是未能侵蚀护盾';
    }
    else {
      info = this.srcPiece.type + ' 对 ' + this.tarPiece.type + ' 使用了 ' + this.cname + '，侵蚀了对方单位';
    }
    return info;
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
  attackRange: number = 1;
  srcPiece: Piece;
  tarPiece: Piece;

  constructor(name: string = 'timeBomb', isUsed: boolean = false) {
    this.name = name;
    this.isUsed = isUsed;
  }

  do() {
    this.isUsed = true;
    this.before = false;
    let info: string;
    info = this.srcPiece.type + ' 放置了一颗 ' + this.cname + '，将在 ' + (this.liveTime - 1) + ' 回合后爆炸';
    return info;
  }
  beforeUse() {
    this.before = true;
  }
}

export class XFlower implements Flower {
  name: string = 'xFlower';
  cname: string = '花朵-X型';
  info: string = '攻击范围：0；放置一颗种子，5回合之后长成一朵花；可放置于任意空白区域';
  isUsed: boolean;
  before: boolean = false;
  growthTime: number = 6;
  attackRange: number = 0;
  srcPiece: Piece;
  tarPiece: Piece;

  constructor(name: string = 'xFlower', isUsed: boolean = false) {
    this.name = name;
    this.isUsed = isUsed;
  }

  do() {
    this.isUsed = true;
    this.before = false;
    let info: string;
    if (this.srcPiece.status.frozen) {
      info = this.srcPiece.type + ' 被冰冻，不能使用道具';
    }
    else {
      info = this.srcPiece.type + ' 放置了一棵 ' + this.cname + ' ，将在 ' + (this.growthTime) + ' 回合后成熟';
    }
    return info;
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
  attackRange: number = 1.5;
  srcPiece: Piece;
  tarPiece: Piece;

  constructor(name: string = 'freezeSpell', isUsed: boolean = false) {
    this.name = name;
    this.isUsed = isUsed;
  }

  do() {
    this.isUsed = true;
    this.before = false;
    let info: string;
    info = this.srcPiece.type + ' 使用了 ' + this.cname + ' ，造成场地冻结效果';
    return info;
  }
  beforeUse() {
    this.before = true;
  }
}