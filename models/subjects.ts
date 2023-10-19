//We will only use one internal structure to keep track of the subjects, we just need the subject_id and the status witch indicates if we have to send or not RISC events for that subject
interface Utente {
    id: string;
    status : string;
}

interface Client {
    clientId: string;
    utenti: Utente[];
}

interface ClientData {
    [clientId: string]: Client;
}

const clientData: ClientData = {};


export function find_clients_by_user(userId: string): Client[] {
    const clients = Object.values(clientData);
    const matchingClients: Client[] = [];

    clients.forEach((client) => {
        const matchingUsers = client.utenti.filter((utente) => utente.id === userId);
        if (matchingUsers.length > 0) {
            matchingClients.push(client);
        }
    });
    return matchingClients;
}


//funcion to add a subject in our internal structure
export function add_subject(clientId: string, userId: string, status: string): void {
    const utente: Utente = {
        id: userId,
        status: status
    };

    if (!clientData[clientId]) {
        clientData[clientId] = {
            clientId: clientId,
            utenti: []
        };
    }

    clientData[clientId].utenti.push(utente);
    console.log(`Subject ${userId} added for client ${clientId} with status: ${status}`);
}

//Funcion to get the status of a specific subject from our internal structure
export function get_subject(clientId: string, userId: string): Utente | undefined {
    const client = clientData[clientId];

    if (client) {
        const subject = client.utenti.find(u => u.id === userId);
        if (subject) {
            return subject;
        } else {
            console.log(`Subject ${userId} not found for client ${clientId}.`);
            return undefined;
        }
    } else {
        console.log(`Client ${clientId} not found.`);
        return undefined;
    }
}

//Funcion to remove one subject from our internal structure
export function remove_subject(clientId: string, userId: string): boolean {
    const client = clientData[clientId];

    if (client) {
        const index = client.utenti.findIndex(u => u.id === userId);
        if (index !== -1) {
            client.utenti.splice(index, 1);
            console.log(`Subject ${userId} removed for client ${clientId}`);
            return true;
        } else {
            console.log(`Subject ${userId} not found for client ${clientId}.`);
            return false;
        }
    } else {
        console.log(`Client ${clientId} not found.`);
        return false;
    }
}

//Funcion to update the status of a subject
export function update_status(clientId: string, userId: string, newStatus: string): boolean {
    const client = clientData[clientId];

    if (client) {
        const subject = client.utenti.find(u => u.id === userId);
        if (subject) {
            subject.status = newStatus;
            console.log(`Status for subject ${userId} updated to: ${newStatus}`);
            return true;
        } else {
            console.log(`Subject ${userId} not found for client ${clientId}. Status not updated.`);
            return false;
        }
    } else {
        console.log(`Client ${clientId} not found. Status not updated.`);
        return false;
    }
}
 




//Variable witch maps the 'format' field with the field used to uniquely identify the subject  
let categories = [ 
    { 'format': 'phone_number', 'value': 'phone_number' },  
    { 'format': 'email', 'value': 'email' }, 
    { 'format': 'account', 'value': 'uri' },
    { 'format': 'opaque', 'value': 'id' }, 
    { 'format': 'did', 'value': 'url' }, 
    { 'format': 'uri', 'value': 'uri' }, 
] 

//Associate to every type of format a funcion that will return the value of the "id" field found on the request (may only need one funcion for everything, still to check)
//For example if the request has "format": "account" "uri": "xxx" the funcion will return "xxx" 
let functions = [ 
    { 'format': 'phone_number', 'function': func }, 
    { 'format': 'email', 'function': func }, 
    { 'format': 'account', 'function': func },
    { 'format': 'opaque', 'function': func }, 
    { 'format': 'did', 'function': func }, 
    { 'format': 'uri', 'function': func }, 
]; 

export function ExtractSubjectID(subject : any){ 
    let format = subject.format;
    //If the format of the subject is one of these we manage it in a second funcion as we will need a different user model to save the user
    if(subject.format === "jwt_id" || subject.format === "saml_assertion_id" || subject.format === "iss_sub" ){
        return ExtractSubjectID2(subject);
    }
    
    //Find the right format->value association inside categories based of the format read from the request
    let category = categories.find(cat => cat.format === format);

    //If we found one (if the format is one of the defined ones) we create a JSON payload, else we return undefined
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

//This i still dont really understand what is for
function callFunction(format: string): Function {
    let funcObj = functions.find(func => func.format === format);
    if (funcObj) {
        return funcObj.function;
    }
    return function () { return ''; };
} 
 
function func(value: string): string {
    return `${value}`;
}

//For the following subject format we check by hand if the required field are present,if we found them we return the payload, if not we return undefined
function ExtractSubjectID2(subject: any) {
    if(subject.format === "jwt_id")
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
    else if(subject.format === "saml_assetion_id")
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
    else
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
}




