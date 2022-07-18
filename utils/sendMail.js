import { createTransport } from "nodemailer";


// to send email of otp to user
export const sendMail = async (email ,subject ,text) => {
const transport = createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: { // to send email using gmail
        user: process.env.SMTP_USER,    // WE Can use "nodemailermail606@gmail.com"  pass "passwordForAbhi"
        pass: process.env.SMTP_PASS,
    },
});


// this fiels which will be send to user
await transport.sendMail({
    from: process.env.SMTP_USER,  // email will be send from this email
    to: email,
    subject,
    text,
});
}