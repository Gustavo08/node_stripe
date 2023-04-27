if ( process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'views')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/crear_pago', async (req, res) => {
    const session = await stripe.checkout.sessions.create({
       payment_method_types: ['card'],
       'line_items':[
        {
            price_data: {
                currency: 'mxn',
                product_data: {
                    name: 'Nombre del producto'
                },
                unit_amount: (100 * 100)
            },
            quantity: 1
        }
       ],
       mode: 'payment',
       'success_url': `http://localhost:4022/success`
    });

    res.redirect(session.url);
});

app.get('/success', (req, res ) => {
    res.sendFile(`${ __dirname}/src/views/success.html`);
});

/* Vamos a crear la ruta para el webhook y que stripe nos pueda notificar
    cuando se haya realizado el pago, escucharemos un evento checkout.session.completed
 */

app.post('/webhook_stripe', (req, res) => {
    let event;
    const endpointSecret = process.env.ENDPOINT_SECRET;
    const body = req.body;
    const payload = {
        id: body.id,
        object: body.type
    }

    const payloadString = JSON.stringify(payload, null, 2);

    const header = stripe.webhooks.generateTestHeaderString({
        payload: payloadString,
        secret: endpointSecret
    });

    try {
        event = stripe.webhooks.constructEvent(payloadString, header, endpointSecret);        
    } catch(error) {
        res.status(400).send(`Webhook Error: ${ error.message}`);
    }

     /* Estamos haciendo uso de localtunnel para poder exponer nuestro servidor a una url publica  */

    switch ( event.object) {
        case 'checkout.session.completed':
            const eventId = event.id;
            console.log("🚀 ~ file: index.js:72 ~ app.post ~ eventId:", eventId);

            /* 
                Aqui ya se podria colocar la funcionalidad para notificasr al usuario
                que su pago se ha realizado correctamente. Con un correo por ejempolo

                Listo, se proceso el pago y recibimos la respuesta del webhook


            */
        break;
        default:
            console.log(`Evento tipo: ${ event.type}`);
    }

    res.send(); // Retornar respuesta 200, para notificar a stripe que se recibio el evento
});

app.listen(process.env.PORT, () =>{
    console.log('El servidor esta corriendo');
})