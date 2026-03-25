import express from 'express';

const app = express();
const PORT = 9090;

app.use(express.json());

app.listen(PORT, () => {
    console.log(`Executando na porta: ${PORT}`)
})