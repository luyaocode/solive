// items.ts

interface Item {
  name: string;
  cname: string;
  isUsed: boolean;
  before: boolean;
  do(): void;
  beforeUse(): void;
}

export class Sword implements Item {
  name: string;
  cname: string = '剑';
  isUsed: boolean;
  before: boolean;

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
  name: string;
  cname: string = '盾';
  isUsed: boolean;
  before: boolean;

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
  name: string;
  cname: string = '弓';
  isUsed: boolean;
  before: boolean;

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
