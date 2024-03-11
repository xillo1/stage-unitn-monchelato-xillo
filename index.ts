import express, { Request, Response, Application } from 'express';
import { updateConfiguration, getConfiguration, deleteConfiguration } from './connections/configuration_endpoint';
import { add_subject_end } from './connections/add_subject_endpoint';
import { remove_subject_end } from './connections/remove_subject_endpoint';
import { verification } from './connections/verification_endpoint';
import { updateStatus, getStatus } from './connections/status_endpoint';
import { connect_to_mongodb } from './MongoDB/database_connection';
import * as events from './events/events_detector';
import { saveJWT} from './models/sharedConfig';
import jwt from 'jsonwebtoken';
import { getJWK } from './connections/JWK';

//String for connecting to DB 
const mongodb_connection_string = 'mongodb://127.0.0.1:27017/risc_db';

const app: Application = express();
app.use(express.json());

//Listen on port 3000
const port = process.env.PORT || 3000;
connect_to_mongodb(mongodb_connection_string);
let JWT : any;
export let server_token = undefined;


app.use((req, res, next) => {
  if(req.url === '/configuration_endpoint' || req.url === '/add_subject_endpoint' || req.url === '/remove_subject_endpoint'|| req.url === '/verification_endpoint'|| req.url === '/status_endpoint' || req.url === '/events_pull')
  {
  const authorizationHeader = req.headers.authorization;
  if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      // Remove bearer part to get only the access token
      const token = authorizationHeader.replace(/^Bearer\s/, '');
      JWT = decode_jwt(token);
      if(JWT === undefined)
      {
        saveJWT(undefined);
        return res.status(401).json({ error: 'Token not valid' });
      }
      saveJWT(JWT);
  } else {
      // Authorization missing or incorrect form
      return res.status(401).json({ error: 'Unauthorized' });
  }
}
    next();
});

//This is the well-known configuration endpoint where the client will connect to receive all the endpoints needed to configure the stream.
app.get('/.well-known/sse-configuration', (req: Request, res: Response) => {

  //Set up the header 
  res.setHeader('Content-Type', 'application/json');

  //We send the 200 OK HTTP status code with the JSON object containing the endpoints            
  res.status(200).json({
    "issuer":
      "server/localhost",
    "jwks_uri":
      "https://localhost/JWK.json",
    "configuration_endpoint":
      "https://localhost/configuration",
    "add_subject_endpoint":
      "https://localhostadd-subject",
    "remove_subject_endpoint":
      "https://localhost/remove-subject",
    "verification_endpoint":
      "https://localhost/verification",
    "status_endpoint":
      "https://localhost/status",
    "delivery_methods_supported": [
      "https://schemas.openid.net/secevent/risc/delivery-method/push",
      "https://schemas.openid.net/secevent/risc/delivery-method/poll"
    ],
  });
});

//Endpoint to get the JSON Web Key
app.get('/jwk', getJWK);       

//Endpoints to manage the stream configuration 
app.post('/configuration_endpoint', updateConfiguration);
app.get('/configuration_endpoint', getConfiguration);
app.delete('/configuration_endpoint', deleteConfiguration);

//Endpoints to add a subject to the stream
app.post('/add_subject_endpoint', add_subject_end);

//Endpoint to remove a subject from the stream
app.post('/remove_subject_endpoint', remove_subject_end);

//Endpoint to reach to request a verification event
app.post('/verification_endpoint', verification);

//Endpoints to manage the status of the stream/subjects
app.get('/status_endpoint', getStatus);
app.post('/status_endpoint', updateStatus);

//Endpoints to reach when a RISC event occurs
app.post('/account-credential-change-required', events.account_credential_change_required);
app.post('/account-purged', events.account_purged);
app.post('/account-disabled', events.account_disabled);
app.post('/account-enabled', events.account_enabled);
app.post('/identifier-changed', events.identifier_changed);
app.post('/identifier-recycled', events.identifier_recycled);
app.post('/credential-compromised', events.credential_compromised);
app.post('/opt-out', events.opt_out);
app.post('/opt-in', events.opt_in);
app.post('/opt-out-initiated', events.opt_out_initiated);
app.post('/opt-out-cancelled', events.opt_out_cancelled);
app.post('/opt-out-effective', events.opt_out_effective);
app.post('/recovery-activated', events.recovery_activated);
app.post('/recovery-information-changed', events.recovery_information_changed);
app.post('/session-revoked', events.session_revoked);

//Endpoint to get the events if pull method is chosen
app.post('/events_pull', events.event_pull);


app.listen(port, async () => {
  console.log(`Server is Fire at http://localhost:${port}`);
  generateKeys();
  getToken();
});


// Function to decode the JWT 
function decode_jwt(token : string)
{
  const decodedToken = jwt.decode(token);
  if (decodedToken && decodedToken.sub) {
    return decodedToken;
  } else {
    return undefined;
  }
}

//Function to generate the public and private keys to sign the RISC events
function generateKeys()
{
  const fs = require('fs');
  const crypto = require('crypto');

  // Generates a pair of RSA keys (public and private)
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
      },
      privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
      }
  });

  // Save public key in a file
  fs.writeFileSync('publicKey.pem', publicKey);

  // Save private key in a file
  fs.writeFileSync('privateKey.pem', privateKey);
} 

//Function to get the server token (We don't actually use it because monokee only accepts basic64 credentials to authenticate)
async function getToken(): Promise<void> {
  const url = 'https://test.monokee.com/6627a356-c838-4ad9-8ff3-e2924b204280/oauth2/651b923d-4daa-4f00-8875-3b89cbb8d421/token';
  const data = new URLSearchParams();
  data.append('grant_type', 'client_credentials');

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic c2hhcmVkc2lnbmFscy1yZXNvdXJjZS1zZXJ2ZXI6c2hhcmVkc2lnbmFscy1yZXNvdXJjZS1zZXJ2ZXI='
  };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: data
    });

    if (response.ok) {
      const data = await response.json();
      server_token = data.access_token;
      console.log('Access Token Server:', data.access_token);
    } else {
      console.error('Error during token request:', response.statusText);
    }
  } catch (error) {
    console.error('Error during token request:', error);
  }
}