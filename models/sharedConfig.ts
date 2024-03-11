
// sharedState.ts
type Stato = "enabled"|"disabled"|"paused";
interface client_JWT
{
    payload : any;
}

const JsonToken: client_JWT = {
    payload : undefined
};

export function saveJWT(jwt: any)
{
   JsonToken.payload = jwt;
}

export function getJWT()
{
    return JsonToken.payload;
}



export interface Client_config {
    client_id:string;
    events_requested: string[];
    events_delivered: string[]; 
    endpoint_delivery_url: string;
    delivery: string;
    delivery_method: string;
    aud:string[];
    status:Stato;
    events: RequestInit[];
    index: number;
}

interface ClientData {
    [clientId: string]: Client_config;
}

const clients: ClientData = {};

// Fucntion to update a client stream configuration
export function update_config(clientId: string, updatedConfig: Client_config): void {
    clients[clientId] = updatedConfig;
    console.log(`Configuration for client ${clientId} updated.`);
    return;
}

// Fucntion to obtain a client stream configuration
export function get_config(clientId: string): Client_config | undefined {
    const clientConfig = clients[clientId];
    if (clientConfig) {
        return clientConfig;
    } else {
        console.log(`Configuration for client ${clientId} not found.`);
        return undefined;
    }
}
// Fucntion to delete a client stream configuration
export function deleteClientConfig(clientId: string): boolean {
    if (clients[clientId]) {
        delete clients[clientId];
        console.log(`Configuration for client ${clientId} eliminated.`);
        return true; 
    } else {
        console.log(`Client with ID ${clientId} not found. Configuration not eliminated.`);
        return false; 
    }
}
// Fucntion to update the status of a client stream configuration
export function update_status_config(clientId: string, newStatus: Stato): boolean {
    const clientConfig = clients[clientId];
    if (clientConfig) {
        clientConfig.status = newStatus;
        console.log(`Stream status for client ${clientId} updated to a: ${newStatus}`);
        return true;
    } else {
        console.log(`Client with ID ${clientId} not found. Status not updated.`);
        return false;
    }
}