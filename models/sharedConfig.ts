
// sharedState.ts
type Stato = "enabled"|"disabled"|"paused";

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

// Funzione per aggiornare la configurazione di un client
export function update_config(clientId: string, updatedConfig: Client_config): void {
    clients[clientId] = updatedConfig;
    console.log(`Configuration for client ${clientId} updated.`);
    return;
}

// Funzione per ottenere la configurazione di un client
export function get_config(clientId: string): Client_config | undefined {
    const clientConfig = clients[clientId];
    if (clientConfig) {
        return clientConfig;
    } else {
        console.log(`Configuration for client ${clientId} not found.`);
        return undefined;
    }
}

export function deleteClientConfig(clientId: string): boolean {
    // Verifica se il client esiste nella struttura dati
    if (clients[clientId]) {
        // Elimina il client dalla struttura dati
        delete clients[clientId];
        console.log(`Configuration for client ${clientId} eliminated.`);
        return true; // Restituisce true se il cliente è stato eliminato con successo
    } else {
        console.log(`Client with ID ${clientId} not found. Configuration not eliminated.`);
        return false; // Restituisce false se il cliente non è stato trovato
    }
}

export function update_status_config(clientId: string, newStatus: Stato): boolean {
    const clientConfig = clients[clientId];

    // Se il client esiste, aggiorna lo stato
    if (clientConfig) {
        clientConfig.status = newStatus;
        console.log(`Stream status for client ${clientId} updated to a: ${newStatus}`);
        return true; // Restituisce true se lo stato è stato aggiornato con successo
    } else {
        console.log(`Client with ID ${clientId} not found. Status not updated.`);
        return false; // Restituisce false se il cliente non è stato trovato
    }
}
