import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY)

const domain = process.env.NEXT_PUBLIC_APP_URL

export async function sendVerificationEmail(email: string, token: string){
    try{
    
        const confirmLink = `${domain}/verify-email?token=${token}`

        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Confirm your email",
            html: `<p>Click <a href="${confirmLink}">here</a> to verify email. </p>`
        })
    }catch(error){
        console.log("Error while sending email", error)
    }
}

export async function sendPasswordResetEmail(email: string, token: string){
    try{

        const resetLink = `${domain}/reset-password?token=${token}`

        console.log("hello")

        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Reset your email",
            html: `<p>Click <a href="${resetLink}">here</a> to reset password. </p>`
        })

    }catch(error){
        console.log("Error sending email", error)
    }
}