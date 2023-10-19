import express, { Request, Response, Application } from 'express';
import dotenv from 'dotenv';
import { updateConfiguration, getConfiguration, deleteConfiguration } from './connections/configuration_endpoint';
import { add_subject_end } from './connections/add_subject_endpoint';
import { remove_subject_end } from './connections/remove_subject_endpoint';
import { verification } from './connections/verification_endpoint';
import { updateStatus, getStatus } from './connections/status_endpoint';
import { connect_to_mongodb } from './MongoDB/database_connection';
import * as events from './events/events_detector';
import {get_config} from './models/sharedConfig';
import jwt from 'jsonwebtoken';

//For env File 
dotenv.config();

//String for connecting to DB 
const mongodb_connection_string = 'mongodb://127.0.0.1:27017/risc_db';

const app: Application = express();
app.use(express.json());

//Listen on port 3000
const port = process.env.PORT || 3000;
connect_to_mongodb(mongodb_connection_string);
let sub:string | undefined;
let server_token;


app.use((req, res, next) => {

  if(req.url !== '/account-credential-change-required')
  {
  const authorizationHeader = req.headers.authorization;
  if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      // Remove bearer part to get only the access token
      const token = authorizationHeader.slice(7); 
      sub = decode_jwt(token);
      req.body.sub = sub;
      if(sub === undefined)
      {
        return res.status(401).json({ error: 'Missing sub field' });
      }
      else{
        if(req.url !== '/configuration_endpoint')
        {
          const stream_status = get_config(sub)?.status;
          if(stream_status !== 'enabled')
          {
            return res.status(403).json({error: "Stream not configured"}); 
          }
        }
      }
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
    "issuer":
      req.header('Host'),
    "jwks_uri":
      "https://localhost/jwks.json",
    "delivery_methods_supported": [
      "https://schemas.openid.net/secevent/risc/delivery-method/push",
      "https://schemas.openid.net/secevent/risc/delivery-method/poll"
    ],
    "critical_subject_members": [
      "user"
    ]
  });
});


app.post('/configuration_endpoint', updateConfiguration);
app.get('/configuration_endpoint', getConfiguration);
app.delete('/configuration_endpoint', deleteConfiguration);

app.post('/add_subject_endpoint', add_subject_end);

app.post('/remove_subject_endpoint', remove_subject_end);

app.post('/verification_endpoint', verification);

app.get('/status_endpoint', getStatus);
app.post('/status_endpoint', updateStatus);

app.post('/account-credential-change-required', events.account_credential_change_required);

app.get('/events_pull', events.event_pull);


app.listen(port, async () => {
  console.log(`Server is Fire at http://localhost:${port}`);

  const url = 'https://test.monokee.com/6627a356-c838-4ad9-8ff3-e2924b204280/oauth2/651b923d-4daa-4f00-8875-3b89cbb8d421/token';
  const data = new URLSearchParams();
  data.append('grant_type', 'client_credentials');

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic c2hhcmVkc2lnbmFscy1yZXNvdXJjZS1zZXJ2ZXI6c2hhcmVkc2lnbmFscy1yZXNvdXJjZS1zZXJ2ZXI='
  };

  async function getToken(): Promise<void> {
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
  getToken();
});


function decode_jwt(token : string)
{
  const decodedToken = jwt.decode(token);
  if (decodedToken && decodedToken.sub) {
    
    return JSON.stringify(decodedToken.sub);
  } else {
    return undefined;
  }
}


