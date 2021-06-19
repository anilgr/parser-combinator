const updateParserState = (state, index, result) => {
    return { ...state, index, result };
}

const updateParserResult = (state, result) => {
    return { ...state, result };
}

const updateParserError = (state, errorMsg) => {
    return { ...state, isError: true, error: errorMsg}
}


class Parser {

    constructor(stateTransformFn){
        this.stateTransformFn = stateTransformFn;
    }

    run(target) {
        const initialState = {
            target,
            result: null,
            index: 0,
            error: null,
            isError: false
        }
        return this.stateTransformFn(initialState);
    }

    map(resultTransformFn) {
        return new Parser(parserState => {
            const nextState = this.stateTransformFn(parserState);

            if(nextState.isError) return parserState;
            
            return updateParserResult(parserState, resultTransformFn(nextState.result));
        })
    }

}

const str = s=>new Parser((parserState) => {

    let { target, index, isError } = parserState;

    if (isError) {
        return parserState;
    }

    target = target.slice(index);

    if (target.length === 0) {
        return updateParserError(parserState, `str: tried to match ${s} but got end of input error.`)
    }
    if (target.startsWith(s)) {
        return updateParserState(parserState, index + s.length, s );
    }
    
    return updateParserError(parserState, `str: could not find string ${s} at the index ${parserState.index}`);

})

const lettersRegex = /^[a-zA-Z]+/i
const letters = new Parser((parserState) => {

    let { target, index, isError } = parserState;

    if (isError) {
        return parserState;
    }

    target = target.slice(index);

    if (target.length === 0) {
        return updateParserError(parserState, `letters: got end of input error.`)
    }

    const match = target.match(lettersRegex);

    if(match){
        return updateParserState(parserState, index + match[0].length, match[0])
    }

    return updateParserError(parserState, `letters: could not match letters at index ${index}`)

})

const digitRegex = /[0-9]/i
const digit = new Parser((parserState) => {

    let { target, index, isError} = parserState;

    if (isError) {
        return parserState;
    }

    target = target.slice(index);

    if (target.length === 0) {
        return updateParserError(parserState, `digit: got end of input error.`)
    }

    let match  = target.match(digitRegex);

    if (match) {
        return {...parserState, result: Number(match[0]), index: index + 1 }
    }

    return updateParserError(parserState, `digit: could not parse digit at index ${index}`);

})

const digitsRegex = /[0-9]+/i
const digits = new Parser((parserState) => {

    let { target, index, isError} = parserState;

    if (isError) {
        return parserState;
    }

    target = target.slice(index);

    if (target.length === 0) {
        return updateParserError(parserState, `digits: got end of input error.`)
    }

    let match  = target.match(digitsRegex);

    if (match) {
        return {...parserState, result: Number(match[0]), index: index + 1 }
    }

    return updateParserError(parserState, `digit: could not parse digits at index ${index}`);

})

const sequenceOf = (parsers) => new Parser((parserState) => {

    if (parserState.isError) {
        return parserState;
    }

    const results = [];
    let nextState = parserState;
    for ( let p of parsers) {
        let testState = p.stateTransformFn(nextState);
        if (testState.isError) {
            throw Error(`Could not parse at position ${testState.index}`)
        } else {
            results.push(testState.result);
            nextState = testState
        }
    }

    return updateParserResult(parserState, results);

})

const choice = (parsers) => new Parser((parserState) => {

    if (parserState.isError) {
        return parserState;
    }

    for ( let p of parsers) {
        const nextState = p.stateTransformFn(parserState);
        if (!nextState.isError) {
            return nextState;
        }
    }

    return updateParserError(
        parserState,
        `choice: unable to match with any parser at index ${parserState.index}`
    )
})








console.log(
    sequenceOf(
       [
        str('a'),
        str('n'),
        str('i'),
       ]
    )
    .map((result=>{
        return result.map((i)=>{
            return `* - ${i}`
        })
    }))
    .run('ani')
);