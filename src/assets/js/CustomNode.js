export class CustomNode {
    constructor(name, childrenIds) {
        this.name = name;
        this.childrenIds = childrenIds ?? [];
    }

    copy() {
        return new CustomNode(this.name, this.childrenIds);
    }
}