import { Request, Response } from 'express';
import { find_clients_by_user, get_subject } from '../models/subjects';
import { getJWT, get_config } from '../models/sharedConfig';


const jwt = require('jsonwebtoken');
const fs = require('fs');

//Here are the various endpoint for the RISC events, each endpoint must be reached only when the user causes that specific event,
//each endpoint calls the same funcion with the event 
export async function account_credential_change_required(req: Request, res: Response){
  events_checker(req,res,'https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required');
}
export async function account_purged(req: Request, res: Response){
  events_checker(req,res,'https://schemas.openid.net/secevent/risc/event-type/account-purged');
}
export async function account_disabled(req: Request, res: Response){
  events_checker(req,res,'https://schemas.openid.net/secevent/risc/event-type/account-disabled');
}
export async function account_enabled(req: Request, res: Response){
  events_checker(req,res,'https://schemas.openid.net/secevent/risc/event-type/account-enabled');
}
export async function identifier_changed(req: Request, res: Response){
  events_checker(req,res,'https://schemas.openid.net/secevent/risc/event-type/identifier-changed');
}
export async function identifier_recycled(req: Request, res: Response){
  events_checker(req,res,'https://schemas.openid.net/secevent/risc/event-type/identifier-recycled');
}
export async function credential_compromised(req: Request, res: Response){
  events_checker(req,res,'https://schemas.openid.net/secevent/risc/event-type/credential-compromised');
}
export async function opt_out(req: Request, res: Response){
  events_checker(req,res,'https://schemas.openid.net/secevent/risc/event-type/opt-out');
}
export async function opt_in(req: Request, res: Response){
  events_checker(req,res,'https://schemas.openid.net/secevent/risc/event-type/opt-in');
}
export async function opt_out_initiated(req: Request, res: Response){
  events_checker(req,res,'https://schemas.openid.net/secevent/risc/event-type/opt-out-initiated');
}
export async function opt_out_cancelled(req: Request, res: Response){
  events_checker(req,res,'https://schemas.openid.net/secevent/risc/event-type/opt-out-cancelled');
}
export async function opt_out_effective(req: Request, res: Response){
  events_checker(req,res,'https://schemas.openid.net/secevent/risc/event-type/opt-out-effective');
}
export async function recovery_activated(req: Request, res: Response){
  events_checker(req,res,'https://schemas.openid.net/secevent/risc/event-type/recovery-activated');
}
export async function recovery_information_changed(req: Request, res: Response){
  events_checker(req,res,'https://schemas.openid.net/secevent/risc/event-type/recovery-information-changed');
}
export async function session_revoked(req: Request, res: Response){
  events_checker(req,res,'https://schemas.openid.net/secevent/risc/event-type/session-revoked');
}

//This endpoint is for the verification event, since it is not a real event we don't need to check the subject, so we just 
//check the configuration of the client and send the verification to the delivery endpoint
export async function verification_sender(req: Request, state: string){
  
  const event_type = 'https://schemas.openid.net/secevent/risc/event-type/verification';
  const currentDate = new Date();
  const client_token = getJWT();
  const config = get_config(client_token.sub); 

  if(config === undefined || config.status === "disabled")
  {
    console.log("Configuration not found or stream not active");
    return;
  }

  const url = config?.endpoint_delivery_url;
  const eventBody = {
    iss:"server/localhost",
    jti:"unique_filed_to_implement",
    iat:Math.floor(currentDate.getTime() / 1000),
    aud:config.aud,
    events: {
      [event_type]: {
        state: state,
      }
    }
  };

  const requestOptions: RequestInit = {
    method: 'POST',
    headers:{
        'Content-Type': 'application/json',
        'Authorization': ecnrypt(eventBody),
    },
    body: JSON.stringify(eventBody),
  };

  try {
    const response = await fetch(url, requestOptions);
    if (response.ok) {
      const data = await response.text();
      try {  
        const jsonData = JSON.parse(data);
        console.log(jsonData);
      } catch (error) {
          console.error('Errore durante il parsing della stringa JSON:', error);
      }
      } else {
        console.error('Errore durante la richiesta:', response.statusText);
      }
  } catch (error) {
    console.error('Errore durante la richiesta:', error);
  }
}

//When we detect a RISC event we check the authorizazion token, if there is we call introspectToken wich sends it to monokee with the server authentication 
//credentials to see if the token is valid and the subject is active
export async function events_checker(req: Request, res: Response, event_type:string){
    
    const authorizationHeader = req.headers.authorization;
    if(authorizationHeader)
    {
      const token = authorizationHeader.replace(/^Bearer\s+/i, '');
      const subject = await introspectToken(token);
      if(subject !== undefined && subject.active)
      {
        const clients = find_clients_by_user(subject.username);
        events_sender(event_type,clients, subject);
      }
      else
      {
        console.log("Subject not identified or active in monokee");
      }
    }
    res.sendStatus(204);
}



//This function is used to send/save the events detected for a specific subject
async function events_sender(event_type: string, clients:any, subject_token: any)
{
  const currentDate = new Date(); 
  if(clients.length<=0)
  {
    console.log("No client associated with this subject");
    return;
  }


  for (const client of clients) {

    const clientId = client.clientId;
    const config = get_config(clientId);
    const subject = get_subject(clientId, subject_token.username);
    if(config !== undefined && config.status === "enabled" && subject !==undefined && subject.status === "enabled")
    {    
      const eventFound = config.events_delivered.includes(event_type);
      if(eventFound)
      {
        const url = config?.endpoint_delivery_url;
        const eventBody = {
          iss:"server/localhost",
          jti:"unique_filed_to_implement",
          iat:Math.floor(currentDate.getTime() / 1000),
          aud:config.aud,
          events: {
            [event_type]: {
              subject: {
                format: 'email',
                email: subject.id
              }
            }
          }
        };

        const requestOptions: RequestInit = {
          method: 'POST',
          headers:{
            'Content-Type': 'application/json',
            'Authorization': ecnrypt(eventBody),
          },
          body: JSON.stringify(eventBody),
        }; 

        if(config.delivery_method==="push")
        {
          try {
            const response = await fetch(url, requestOptions);
            if (response.ok) {
              const data = await response.text();
              try {  
                const jsonData = JSON.parse(data);
                console.log(jsonData);
              } catch (error) {
                console.error('Errore durante il parsing della stringa JSON:', error);
              }
              } else {
                console.error('Errore durante la richiesta:', response.statusText);
              }
          } catch (error) {
            console.error('Errore durante la richiesta:', error);
          }
        }

        else if(config.delivery_method==="pull")
        {
          config.events[config.index] = requestOptions;
          config.index++;
        }
      }
    }
  }
}

//Endpoint if the configuration is pull
export async function event_pull(req:Request, res:Response)
{
  const client_token = getJWT(); 
  const config = get_config(client_token.sub);
  if(config === undefined)
  {
    return res.status(403).json({error: "Stream configuration not found"});
    
  }

  if(config.index <= 0 )
  {
    return res.status(202).json({error: "No events found"});
  }
  res.json(config.events[config.index-1]);
  config.index--;
}


async function introspectToken(token:string) {
  
  const url = 'https://test.monokee.com/6627a356-c838-4ad9-8ff3-e2924b204280/oauth2/651b923d-4daa-4f00-8875-3b89cbb8d421/token/introspect';
  //Server credentials (if monokee decides to support authentication with bearer token we can use the token we get at the launch of the server)
  const base64Credentials = btoa('sharedsignals-resource-server:sharedsignals-resource-server'); 

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${base64Credentials}`
      },
      body: new URLSearchParams({ 'token': token })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Request error:', error);
    return undefined;
  }
}


function ecnrypt(eventBody : any)
{
  const privateKey = fs.readFileSync('privateKey.pem', 'utf8').trim();
  const token = jwt.sign(eventBody, privateKey, { algorithm: 'RS256' });
  return token;
    
}