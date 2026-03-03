import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const connectDB = async () =>{
    try{
        await mongoose.connect(`${process.env.MONGO_URI}`,{
            autoIndex: true,
        });
        console.log('MongoDB connected successfully with :', process.env.MONGO_URI);
    }
    catch(error){
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

export default connectDB;