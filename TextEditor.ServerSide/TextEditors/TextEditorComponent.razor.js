export class TextEditor {
    // # fields...
    //
    // NOTE: clear() needs to be updated such that a component can
    // be re-used for more than one text file.
    //
    // This isn't to say that tabs can't exist,
    // but instead that if you elect for a "single tab editor",
    // you can open various files in that "single tab editor" albeit only one at a time.
    //
    /* ============================================================================== */
    //
    // # text...
    //
    // It is believed that the long term implementation ought to be a combination
    // of a rope and gapbuffer.
    //
    // First implementation: just modify a string directly
    // Second implementation: modify a rope
    // Third implementation modify a gapbuffer and "persist" non-contiguous edits to the rope
    //
    text;
    // # lineEndPositionList...
    //
    // It is likely a bad idea to structure a text editor with a list of line end positions like this.
    // I've made a lot of progress though optimizing other parts of the text editor, so I need to just get those typed up and working.
    // And just as I did with those optimizations, when the time comes I'll optimize this list.
    //
    // The issue is that the cost of this is 1 to 1 tied to the count of line endings. And that can be decently expensive quite fast.
    // If you're going to go down this route, the question of whether you are storing:
    // - lineEndings
    // OR
    // - lineBreaks
    // ... comes into play.
    //
    // Since you already have the likely unoptimized solution, I think you might as well add 1 extra entry
    // in the list that represents the EOF, i.e.: you are storing the lineEndings.
    //
    // The alternative is to store the lineBreaks, and while this isn't the most complicated thing in the world
    // you end up with the lineIndex NOT corresponding to the same index for the "lineEndPositionList".
    //
    // The wording is a bit muddied on my end. But the end of the first line is asking what
    // the end of the 0th index line is. You look this up in the this.lineEndPositionList with an index of 0
    // and this is somewhat nice.
    //
    // The alternative of lineBreaks means you have to lookup in the "lineBreakPositionList" at
    // index of 'lineIndex - 1' more or less. (there are more "edge cases" involved as well such as the 0th line
    // giving an index of -1, and it just is sort of a headache that seems unnecessary vs tracking 1 additional entry.)
    //
    // One last clarification, this is the way I came to define these words after having
    // dealt with this "lineEnd vs lineBreak 'phenomenon'" first hand.
    //
    // Whether other people would agree with me I am not sure.
    // Essentailly, a lineBreak implies that a line exists after that position, whether that line be length 0 or not.
    //
    // A lineEnding doesn't indicate there exists a line after.
    //
    lineEndPositionList;

    constructor(text) {
        
        this.lineEndPositionList = [];
        this.setText(text);
    }

    getText() {
        return this.text;
    }

    setText(text) {
        this.clear();
        this.text = text;
        for (let i = 0; i < this.text.length; i++) {
            if (this.text[i] == '\n') {
                this.lineEndPositionList.push(i);
            }
        }
    }

    clear() {
        this.text = '';
        this.lineEndPositionList = [];
    }

    // # design decisions...
    //
    // This "section" of comments specifically relates to design decisions
    // that have no clear location in which to put a comment for.
    //
    // i.e.: 'this.lineEndPositionList' is a field, thus
    // the comment that explains its design decision is directly above its declaration.
    //
    // But, the tab support doesn't have a direct tie to any particular field,
    // thus it has a design decision comment here.
    //
    /* ============================================================================= */
    //
    // # tab support...
    //
}
