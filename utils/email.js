const nodeMailer = require('nodemailer');

const sendEmail = async options => {
    // create a transporter
    const transporter = nodeMailer.createTransport({
        // using gmail, hotmail, yahoo etc just pass service and auth no need for port and host
        // // service: 'Gmail', 
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
        //Activate in gmail 'less secure app' option
    })
    // define the email options
    const mailOptions = {
        from: 'Anjee Ade <test1@email.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html
    }
    // Actually send the email with nodemailer
    await transporter.sendMail(mailOptions)
}

module.exports = sendEmail;