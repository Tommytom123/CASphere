class Parent{
    constructor(a, b){
        this.apple = a
        this.banana = b
    }

    food(){
        return this.apple + this.banana
    }
}

const parent1 = new Parent("apple", "yucky")

class Child1{
    constructor(a, parent){
        this.parent = parent
        this.tasty = a
    }
}

class Child2{
    constructor(a){
        
        this.disgusting = a
    }
}



var child1 = new Child1('no',parent1)


console.log(child1.parent.food())