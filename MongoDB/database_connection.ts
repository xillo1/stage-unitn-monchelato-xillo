import mongoose from 'mongoose';


//Connection to MongoDB database
async function database_connect(connection_string:string) {
    await mongoose.connect(connection_string);
}

export async function connect_to_mongodb(mongodb_connection_string : string)
{
    try{
        await database_connect(mongodb_connection_string);
    }catch(error){
        console.log('Error connectiong to DB', error)
    }
}

