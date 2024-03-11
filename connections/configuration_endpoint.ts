//This is the configuration endpoint used to read, update or delete the configuration of the stream.

import { Request, Response } from 'express';
import {Client_config, deleteClientConfig, getJWT, get_config, update_config} from '../models/sharedConfig';

//This is the list of events supported, we will 
const events_supported = [
  "https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required",
  "https://schemas.openid.net/secevent/risc/event-type/account-purged",
  "https://schemas.openid.net/secevent/risc/event-type/account-disabled",
  "https://schemas.openid.net/secevent/risc/event-type/account-enabled",
  "https://schemas.openid.net/secevent/risc/event-type/identifier-changed",
  "https://schemas.openid.net/secevent/risc/event-type/identifier-recycled",
  "https://schemas.openid.net/secevent/risc/event-type/credential-compromise",  
  "https://schemas.openid.net/secevent/risc/event-type/opt-in",
  "https://schemas.openid.net/secevent/risc/event-type/opt-out-initiated",
  "https://schemas.openid.net/secevent/risc/event-type/opt-out-cancelled",
  "https://schemas.openid.net/secevent/risc/event-type/opt-out-effective",
  "https://schemas.openid.net/secevent/risc/event-type/recovery-activated",
  "https://schemas.openid.net/secevent/risc/event-type/recovery-information-changed",
  "https://schemas.openid.net/secevent/risc/event-type/sessions-revoked",];

  //Initialization of the confgiuration of a client
  let clientConfig: Client_config = {
    client_id: "",
    events_requested: [],
    events_delivered: [], 
    endpoint_delivery_url: "", 
    delivery: "",
    delivery_method: "",
    aud: [],
    status:"disabled",
    events:[],
    index:0,
};


//This endpoint is to update the stream configurat   (POST request)
export function updateConfiguration(req: Request, res: Response) {
  //This function return true is the fields 'iss' and 'aud' are present, false otherwise
  if(!conf_verification_post(req,res))
  {
    return res.status(403).json({error: "iss or aud missing"})    
  }

  clientConfig.aud = req.body.aud;
  //If delivery is present and not null we save the informations, else: Missing properties SHOULD be interpreted as requested to be deleted
  if(req.body.hasOwnProperty('delivery') && req.body.delivery !== undefined){
    clientConfig.delivery = req.body.delivery; 
    //If delivery field is present there has to be the following two fields
    if(req.body.delivery.hasOwnProperty('delivery_method') && req.body.delivery.delivery_method !== undefined && req.body.delivery.hasOwnProperty('url') &&  req.body.delivery.url !== undefined){
      const dlv_mth = req.body.delivery.delivery_method;
      const parts = dlv_mth.split('/');
      const method = parts[parts.length -1];
      if(method !== "push" && method !=="pull")
      {
        res.status(200).json({error: "Delivery method not supported"});
        return;
      }
      clientConfig.delivery_method=method;
      clientConfig.endpoint_delivery_url = req.body.delivery.url;
    }
    else
    {
      res.status(400).json({error: 'delivery field set up incorrectly'});
      return;
    }
  }
  else{
    clientConfig.delivery = "";
    clientConfig.delivery_method="";
    clientConfig.endpoint_delivery_url="";
  }

  //If events_requested is present and not null we save the informations, else: Missing properties SHOULD be interpreted as requested to be deleted
  if(req.body.hasOwnProperty('events_requested') && req.body.events_requested !== undefined){
    clientConfig.events_requested =  req.body.events_requested;
  }
  else{
    clientConfig.events_requested=[""];
  }

  //Filtering events supported and requested
  clientConfig.events_delivered = events_supported.filter(event => clientConfig.events_requested.includes(event));

  //(OPTIONAL) Saving format client wants for subject
  const format = req.body.format;
  clientConfig.status = "enabled";

  //This function will create a client configuration object identified by the sub field found in the bearer token sent by the client, (saved 
  //in a field req.body.sub wich should be modified)
  const client_token = getJWT();
  update_config(client_token.sub, clientConfig);

  //Set up the header 
  res.setHeader('Content-Type', 'application/json');
  

  //Once we saved the configuration we can send the response to the client with the updated configuration
  if(clientConfig.delivery_method === "pull"){
    res.status(200).json({
      "iss":
        "localhost/server",
      "aud": 
        clientConfig.aud,
      "delivery": {
        "url": "http://127.0.0.1/events_pull",
        "delivery_method": clientConfig.delivery_method,
      },
      events_supported,
      "events_requested": clientConfig.events_requested,
      "events_delivered": clientConfig.events_delivered,
      format,
    });
  }
  else
  {
    res.status(200).json({
      "iss":
        "localhost/server",
      "aud": 
        clientConfig.aud,
      "delivery": {
        "url": clientConfig.endpoint_delivery_url,
        "delivery_method": clientConfig.delivery_method,
      },
      events_supported,
      "events_requested": clientConfig.events_requested,
      "events_delivered": clientConfig.events_delivered,
      format,
    });
  }
}


//This endpoint is to read the stream configuration
export function getConfiguration(req: Request, res: Response) {

  const client_token = getJWT();
  //We take the configuration using the client id saved in req.body.sub(should be modified)
  const config = get_config(client_token.sub)
  if(config !== undefined)
  {
    //Set up the header 
    res.setHeader('Content-Type', 'application/json');

    res.status(200).json({
      "iss":
        "localhost/server",
      "aud": [
        clientConfig.aud,
      ],
      "delivery": {
        "url": config.endpoint_delivery_url,
        "delivery_method": config.delivery_method,
      },
      events_supported,
      "events_requested": clientConfig.events_requested,
      "events_delivered": clientConfig.events_delivered,
    });
  } 
  else{
    res.setHeader('Content-Type', 'application/json');
    res.status(400).json({error: "Stream not configured"});
  }
}


//This endpoint is to delete the stream configuration
export function deleteConfiguration(req: Request, res: Response) {

  const client_token = getJWT();
  //We delete the configuration using the client id saved in req.body.sub(should be modified)
  if(deleteClientConfig(client_token.sub)){
    res.sendStatus(200);
  }
  else
  {
    res.status(403).json({error: 'Configuration not deleted, no configuration found for: ' + client_token.sub});
  }
}


function conf_verification_post( req:Request, res:Response ): boolean
{
  //Try access body of request
  const reqbody = req.body;
  if (!reqbody) {
    //If the body cannot be analyzed return false and send an error
    res.status(400).json({ error: 'Request not valid' });
    return false;
  } 

  //Check if the request body has all the information needed in the update_configuration endpoint to work, the fields necessasry are 'iss' and 'aud'
  if(req.body.hasOwnProperty('iss') && req.body.iss !== undefined){
      
    if(req.body.hasOwnProperty('aud') && req.body.aud !== undefined){
      return true;
    }
    res.status(400).json({error: 'aud field not found or epmty'});
    return false;
  }
  res.status(400).json({error: 'iss field not found or empty'});
  return false;
}