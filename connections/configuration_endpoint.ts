//This is the configuration endpoint used to read, update or delete the configuration of the stream.

import { Request, Response } from 'express';
import { setStatus } from './status_endpoint';
import { sharedState } from '../models/sharedState';
import { conf_verification_post } from '../functions/configuration_verification';


const events_supported = [
  "http://localhost/account-credential-change-required",
  "http://localhost/account-purged",
  "http://localhost/account-disabled",
  "http://localhost/account-enabled",
  "http://localhost/identifier-changed",
  "http://localhost/identifier-recycled",
  "http://localhost/credential-compromised",  
  "http://localhost/opt-in",
  "http://localhost/opt-out-initiated",
  "http://localhost/opt-out-cancelled",
  "http://localhost/opt-out-effective",
  "http://localhost/recovery-activated",
  "http://localhost/recovery-information_changed",
  "http://localhost/session-revoked",];

let events_requested = "";
let events_delivered = [""]; 
let endpoint_delivery_url = "";
let delivery = "";
let delivery_method = "";



//This endpoint is to update the stream configuration (POST)
export function updateConfiguration(req: Request, res: Response) {
  if(conf_verification_post(req,res))
  {
      //Saving the audience of the message
      const aud = req.body.aud;    
    
      //Saving the delivery method chosen (in lastpart) 
      delivery = req.body.delivery; 
      delivery_method = req.body.delivery.delivery_method;
      const parts = delivery_method.split('/');
      endpoint_delivery_url = req.body.delivery.url + parts[parts.length - 1];
    
      //Saving the events requested from client
      events_requested =  req.body.events_requested;

      //Filtering events supported and requested
      events_delivered = events_supported.filter(event => events_requested.includes(event));

      //(OPTIONAL) Saving format client wants for subject
      const format = req.body.format;

      //Set up the header 
      res.setHeader('Content-Type', 'application/json');
      
      //Send response to client with 200 OK
      res.status(200).json({
        "iss":
          req.body.iss,
        "aud": 
          aud,
        "delivery": {
          "url": endpoint_delivery_url,
          delivery_method
        },
          events_supported,
          events_requested,
          events_delivered,
          format,
      });
    setStatus("enabled");
  }
}





//This endpoint is to read the stream configuration
export function getConfiguration(req: Request, res: Response) {
  //Take the decoded JWT and save it 
  const jwtPayload = sharedState.jwtPayload;

  if(sharedState.jwtPayload.hasOwnProperty('iss') && sharedState.jwtPayload.iss !== undefined)
  {
    if(sharedState.jwtPayload.hasOwnProperty('aud') && sharedState.jwtPayload.aud !== undefined)
    {   
      //Set up the header 
      res.setHeader('Content-Type', 'application/json');

      res.status(200).json({
        "iss":
          jwtPayload.iss,
        "aud": [
          jwtPayload.aud,
        ],
        "delivery": {
          "url": endpoint_delivery_url,
          delivery_method,
        },
          events_supported,
          events_requested,
          events_delivered,
      });
    }
    else{res.status(400).json({error : 'aud field not found or empty'}); }
  }
  else{res.status(400).json({error : 'iss field not found or empty'});}
    
}
  

//This endpoint is to delete the stream configuration
export function deleteConfiguration(req: Request, res: Response) {
  events_requested = "";
  events_delivered = [""];
  endpoint_delivery_url = "";
  delivery = "";
  res.status(200).send();
  setStatus("disabled");  
}