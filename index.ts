import express, { Express, Request, Response, Application } from 'express';
import dotenv from 'dotenv';
import { updateConfiguration, getConfiguration, deleteConfiguration } from './connections/configuration_endpoint';
import { add_subject_end } from './connections/add_subject_endpoint';
import { remove_subject_end } from './connections/remove_subject_endpoint';
import { verification } from './connections/verification_endpoint';
import { decode_JWT } from './functions/decode_jwt';
import { updateStatus,getStatus } from './connections/status_endpoint';
import { connect_to_mongodb } from './MongoDB/database_connection';
import { restrictAccess } from './functions/RestrictAccess';

//For env File 
dotenv.config();

//String for connecting to DB 
const mongodb_connection_string = 'mongodb://127.0.0.1:27017/risc_db';

const app: Application = express();
app.use(express.json());

//Listen on port 3000
const port = process.env.PORT || 3000;
connect_to_mongodb(mongodb_connection_string);


app.use((req, res, next) => {
  //If the request is on the well-known endpoint we don't check the JWT (Since we assume authorization has arledy been verified)
  if (req.path === '/.well-known/sse-configuration') {
    return next();
  }
  //We check the JWT for all the other endpoint
  decode_JWT(req, res, () => restrictAccess(req, res, next));
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

app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port}`);
});
