// InvisibleNode is removed: remove all references. Same for FixedHeader and ScrollableHeaderNodes
// SeparateRoot is removed
class SeparateRoot {
    getValidEditModes() { // separate root has no valid edit modes, just a view
        return [];
    }
}

class Test {

    canAddChild() {

    }

    canAddTest() {
        return false;
    }

    canAddSubgroup() {
        return false;
    }

    getValidEditModes() {
        let editModes = [];
        if (!(this.hasParent() && this.parent.forceNotAddTests)) editModes.push(GROUP_EDIT_MODE.EDIT_TEST, GROUP_EDIT_MODE.DELETE_TEST);
        return editModes;
    }
}

class FunctionalityToImplement {

    checkGradesConstraints(grades) {
        console.assert(grades instanceof Object);
        // console.assert(Object.values(grades).reduce((acc, grade) => acc && grade instanceof CellUtil.Grade, true));
    }

    clearGrades() {
        this.grades = {};
    }

    /**
     * TODO still necessary?
     * Returns the amount of siblings to the left of the group
     */
    getPos() {
        if (!this.parent) return 0;
        for (let i = 0; i < this.parent.children.length; i++) {
            if (this.parent.children[i] === this) return i;
        }
    }

    set grades(grades) {
        console.assert(grades instanceof Object);
        for (const grade of Object.values(grades)) // set appropriate relations
            // TODO make sure that grades are removed from prev grou
            if (grade.group !== this) grade.group = this;

        this._grades = grades;
        this.checkGradesConstraints(this._grades);
    }

    get grades() {
        this.checkGradesConstraints(this._grades);
        return this._grades;
    }

    get gradesArray() {
        return Object.values(this.grades);
    }

    setGrades(grades) {
        console.assert(grades instanceof Object);
        for (let [userId, grade] of Object.entries(grades)) {
            // console.assert(grade instanceof CellUtil.Grade);
            console.assert(grade.userId === parseInt(userId));
            grade.group = this;
        }
        this.grades = grades;
    }

    hasDirtyGrades() {
        return Object.values(this.grades).some(grade => grade.dirty);
    }

    /**
     * Returns true whether the given group has grades. These can also be vakonderdelen if these have tests
     */
    hasCells() {
        return Object.values(this.grades).length > 0;
    }


    get pos() {
        return this.getPos();
    }

    hasGrades() {
        return this.hasCells();
    }

    hasContributingGrades() {
        return this.hasGrades() && Object.values(this.grades).find(g => g.doesContribute());
    }

    hasCommentedGrades() {
        return this.hasGrades() && Object.values(this.grades).find(g => g.comment || g.prevComment);
    }
}

class Vakonderdeel {

    set children(children) {
        super.children = children;
        if (this.hasTests()) { // sort tests based on date
            this.sortTests();
        }
    }

    getValidEditModes() {
        let modes = [GROUP_EDIT_MODE.EDIT_GROUP_COMMENT];
        if (this.canAddTest()) modes.push(GROUP_EDIT_MODE.ADD_TEST, GROUP_EDIT_MODE.IMPORT_TEST);
        if (this.canAddSubgroup()) modes.push(GROUP_EDIT_MODE.ADD_GROUP);
        if (this.editable || this.adjustable) modes.push(GROUP_EDIT_MODE.EDIT_GROUP, GROUP_EDIT_MODE.DELETE_GROUP);
        return modes;
    }

    /**
     * Returns whether the user can add a test to the group
     */
    canAddTest() {
        if (this.forceNotAddTests) return false;

        if (!this.hasChildren()) {
            return true;
        } else if (this.hasTests()) {
            return true;
        } else if (this.children.length === 1 && this.children[0].isTemporary()) {
            return true;
        }
        return false;
    }

    /**
     * Returns whether the user can add a subgroup to the group
     */
    canAddSubgroup() {
        if (!this.hasChildren()) {
            return true;
        } else if (this.hasVakonderdelen()) {
            return true;
        } else if (this.children.length === 1 && this.children[0].isTemporary()) {
            return true;
        }
        return false;
    }

    canZoomIn() {
        return this.hasNonInvisibleParent();
    }

    sortTests() {
        // this.children.forEach(test => console.assert(!!test.date || test.isTemporary()));
        super.children = this.children.sort((child1, child2) => {

            let startDate1, startDate2, endDate1, endDate2;
            if (child1 instanceof TestAggregationCount) {
                startDate1 = child1.startDate;
                endDate1 = child1.endDate;
            } else startDate1 = endDate1 = child1.date;

            if (child2 instanceof TestAggregationCount) {
                startDate2 = child2.startDate;
                endDate2 = child2.endDate;
            } else startDate2 = endDate2 = child2.date;

            if (startDate2 > endDate1) return -1;
            else if (startDate1 > endDate2) return 1;
            else return 0;
        });
    }

}

class Lesgroep {

    hasCells() {
        return Object.values(this.users).length > 0;
    }

    checkUsersConstraints(users) {
        console.assert(users instanceof Object);
    }

    set users(users) {
        this._users = users;
        this.checkUsersConstraints(this._users);
    }

    get users() {
        this.checkUsersConstraints(this._users);
        return this._users;
    }

    get usersArray() {
        return Object.values(this.users);
    }
}


