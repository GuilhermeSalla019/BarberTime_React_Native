const mongoose = require('mongoose');
const URI = 

    'mongodb+srv://userSalao:Campinas123@barbertime.a8lbw1z.mongodb.net/Barber-Time?retryWrites=true&w=majority';
    
    mongoose
    .connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
    })
    .then(() => console.log('DB is Up!'))
    .catch((err) => console.log(err));