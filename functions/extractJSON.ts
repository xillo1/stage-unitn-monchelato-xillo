import { Request } from 'express';

let categories = [ 
    { 'format': 'phone_number', 'value': 'phone_number' },  
    { 'format': 'email', 'value': 'email' }, 
    { 'format': 'account', 'value': 'uri' },
    { 'format': 'opaque', 'value': 'id' }, 
    { 'format': 'did', 'value': 'url' }, 
    { 'format': 'uri', 'value': 'uri' }, 
] 
 
let functions = [ 
    { 'format': 'phone_number', 'function': func1 }, 
    { 'format': 'email', 'function': func2 }, 
    { 'format': 'account', 'function': func3 },
    { 'format': 'opaque', 'function': func4 }, 
    { 'format': 'did', 'function': func5 }, 
    { 'format': 'uri', 'function': func6 }, 
]; 

export function ExtractSubjectID(req: Request){
    let subject = req.body.subject; 
    let format = subject.format;
    if(subject.format == "jwt-id" || subject.format == "saml-assertion-id" || subject.format == "iss-sub" ){
        return ExtractSubjectID2(subject);
    }
    let category = categories.find(cat => cat.format === format);

    if (category) {
        let value = subject[category.value];
        let func = callFunction(format);
        let payload = {
            format: category.format,
            value: func(value)
        };
        return payload;
    } else {
        return undefined;
    }
}

function callFunction(format: string): Function {
    let funcObj = functions.find(func => func.format === format);
    if (funcObj) {
        return funcObj.function;
    }
    return function () { return ''; };
} 
 
function func1(value: string): string {
    return `${value}`;
}

function func2(value: string): string {
    return `${value}`;
}

function func3(value: string): string {
    return `${value}`;
}

function func4(value: string): string {
    return `${value}`;
}

function func5(value: string): string {
    return `${value}`;
}

function func6(value: string): string {
    return `${value}`;
}

function ExtractSubjectID2(subject: any) {
    if(subject.format === "jwt-id")
    {
        if(subject.hasOwnProperty('iss') && subject.hasOwnProperty('jti'))
        {
            let payload = {
                format: subject.format,
                iss: subject.iss,
                value: subject.jti
            };
            return payload;
        }
        return undefined;
    }
    else if(subject.format === "saml-assetion-id")
    {
        if(subject.hasOwnProperty('issuer') && subject.hasOwnProperty('assertion_id'))
        {
            let payload = {
                format: subject.format,
                iss: subject.issuer,
                value: subject.assertion_id
            };
            return payload;
        }
        return undefined;
    }
    else if(subject.format === "iss-sub" )
    {
        if(subject.hasOwnProperty('iss') && subject.hasOwnProperty('sub'))
        {
            let payload = {
                format: subject.format,
                iss: subject.iss,
                value: subject.sub
            };
            return payload;
        }
        return undefined;
    }
    else
    {
        return undefined;
    }
    
}
