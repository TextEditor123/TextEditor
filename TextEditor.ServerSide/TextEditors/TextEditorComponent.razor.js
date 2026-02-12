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
    // A tab character is represented by the following sequence of characters "\t\0\0\0".
    //
    // If a user gesture results in a '\0' being targeted, it is expected
    // that every distinct event would implement a case to support this.
    //
    // i.e.: if the user fires the mousemove event,
    // the support for a '\0' character is as follows:
    // - Check if the position index of the '\0' is equal to EOF (end of file).
    //     - If so, the '\0' represents EOF.
    //     - Else, the '\0' likely represents a "tab character".
    //     - As of this comment this "likely" is a guarantee,
    //       but it is expected that such a pattern will be used for inline-hints in the future.
    //     - The algorithm for determining if you are at a "tab character",
    //       is to iterate the position index that the '\0' exists at
    //       in reverse, until  you find a non '\0' character.
    //     - If the first non '\0' character is '\t',
    //       then you've found a "tab character".
    //
    // # syntax highlighting...
    //
    // Syntax highlighting will be stored in a "list" of "tracked syntax instances".
    // A "while (remaining > 0)" algorithm will be used to
    // apply a css class to a chunk of characters on a line where each chunk is grouped by the span
    // represented via the "tracked syntax".
    //
    // A tracked syntax is a start position, a length, and a TrackedSyntaxKind.
    // The start and length are used in the while (remaining > 0) to group the chunks of text that exist on the same line.
    // The TrackedSyntaxKind is converted to a CSS class via a switch statement.
    //
    //
    // ... prefix with file:// or something when copy is how they prob do it
    // because if you copy a file path in Visual Studio, you cannot paste that path as text.
    // So presumably a check for the some prefix is being used.
    //
    // ... targeting via javascript then low freq gesture => blazor
    // i.e. the text editor cursor should exist solely in JavaScript.
    // you do this by having Blazor render an empty div, then you just let JavaScript go wild and do whatever it wants to that div.
    // Since the div was rendered as empty, then Blazor diff won't touch it.
    //
    // # if you are storing the text in JavaScript, and the lineEndPositions in JavaScript, then
    // how will you look at this data from C# when needed?
    // |
    // I have found this use case to be limited enough in frequency to where it should be either never used,
    // or if it is used, that you could either duplicate the data for that extremely infrequent event
    // and if it is more common than I expect, I am considering streaming from JavaScript to C# using a byte array?
    //
    // When it comes to rendering the text. I don't think I want to use Blazor?
    // The text should be a rather expensive UI piece to deal with just by its nature.
    // Also if I render the text in Blazor it creates this problematic scenario where the JavaScript needs state
    // to move the cursor without interoping with .NET, meanwhile .NET needs state to show the text without "multiple interops with JavaScript / UI"
    //
    // In terms of a general solution that can be applied to a variety of UI when dealing with Blazor.
    // I think the goal should be to have any high frequency events handled entirely in JavaScript.
    //
    // I don't believe the goal of Blazor is to remove 100% of JavaScript.
    // That being said you also for that tiny amount that remains have to use raw JavaScript lest you
    // include two UI frameworks in your app.
    //
    // You could "make the start menu a react app" but it probably is the case that most
    // high frequency events can be moved to raw JavaScript/HTML and be done via Blazor rendering an empty div.
}
