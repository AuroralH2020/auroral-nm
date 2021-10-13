import nodemailer from 'nodemailer'
import fs from 'fs'
import Mustache from 'mustache'
import { Attachment } from 'nodemailer/lib/mailer'
import { Config } from '../config'
import { logger } from '../utils/logger'
import { RegistrationType } from '../persistance/registration/types'
import { InvitationType } from '../persistance/invitation/types'
import { errorHandler } from '../utils/error-handler'

const TEMP_RECOVER_PWD = fs.readFileSync(Config.HOME_PATH + '/src/auth-server/templates/recoverPwd.html', 'utf-8')
const TEMP_ACTIVATE_COMPANY = fs.readFileSync(Config.HOME_PATH + '/src/auth-server/templates/activateCompany.html', 'utf-8')
const TEMP_ACTIVATE_USER = fs.readFileSync(Config.HOME_PATH + '/src/auth-server/templates/activateUser.html', 'utf-8')
const TEMP_NOTIFY_APPROVER = fs.readFileSync(Config.HOME_PATH + '/src/auth-server/templates/notifyApprover.html', 'utf-8')
const TEMP_REJECT_REGISTRATION = fs.readFileSync(Config.HOME_PATH + '/src/auth-server/templates/rejectCompany.html', 'utf-8')
const TEMP_INVITE_COMPANY = fs.readFileSync(Config.HOME_PATH + '/src/auth-server/templates/inviteCompany.html', 'utf-8')
const TEMP_INVITE_USER = fs.readFileSync(Config.HOME_PATH + '/src/auth-server/templates/inviteUser.html', 'utf-8')

const transporter = nodemailer.createTransport({
    host: Config.SMTP.HOST,
    port: Number(Config.SMTP.PORT),
    // secure: true, // true for 465, false for other ports
    auth: {
        user: Config.SMTP.USER,
        pass: Config.SMTP.PASSWORD
    } 
})

const sendMail = async (mails: string | string[], cc: string | string[] | undefined, bcc: string | string[] | undefined, html: string, subject: string, attachments?: Attachment[]) => {
    try {
        const mail_msg = await transporter.sendMail({
            from: Config.SMTP.USER, // sender address
            to: mails, // list of receivers
            cc: cc, // list of cc receivers
            bcc: bcc, // list of bcc receivers
            subject: subject, // Subject line
            html: html, // html body
            attachments: attachments
        })
        logger.debug('Mail sent to: ' + mails + ' with subject ' + subject)
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
    }
}

// Mail types 

export const recoverPassword = async (username: string, token: string, realm?: string) => {
    const dns = realm === 'localhost' || !realm ? 'http://localhost:8000/app/#' : 'https://' + realm + '/nm/#'
    const subject = 'Password recovery email VICINITY'
    const link = `${dns}/authentication/recoverPassword/${token}`
    // TBD: remove after testing
    // logger.debug(link)
    // Replace info
    const view = {
        LINK: link
    }
    const temp = Mustache.render(TEMP_RECOVER_PWD, view)
    sendMail(username, undefined, undefined, temp, subject)
}

export const verificationMail = async (username: string, token: string, type: RegistrationType, realm?: string) => {
    const dns = realm === 'localhost' || !realm ? 'http://localhost:8000/app/#' : 'https://' + realm + '/nm/#'
    const subject = 'Verification email to join VICINITY'
    const templateName = type === RegistrationType.COMPANY ? TEMP_ACTIVATE_COMPANY : TEMP_ACTIVATE_USER
    const link = `${dns}/registration/${type}/${token}`
    // TBD: remove after testing
    // logger.debug(link)
    // Replace info
    const view = {
        LINK: link
    }
    const temp = Mustache.render(templateName, view)
    sendMail(username, undefined, undefined, temp, subject)
}

export const notifyDevOpsOfNewRegistration = async (name: string, company: string) => {
    const subject = 'New registration request'
    // Replace info
    const view = {
        NAME: name,
        COMPANY: company
    }
    const temp = Mustache.render(TEMP_NOTIFY_APPROVER, view)
    sendMail(Config.SMTP.APPROVER_MAIL, undefined, undefined, temp, subject)
}

export const rejectRegistration = async (username: string, company: string) => {
    const subject = 'Issue validating your VICINITY account'
    // Replace info
    const view = {
        COMPANY: company
    }
    const temp = Mustache.render(TEMP_REJECT_REGISTRATION, view)
    sendMail(username, undefined, undefined, temp, subject)
}

export const invitationMail = async (username: string, id: string, type: InvitationType, realm?: string) => {
    const dns = realm === 'localhost' || !realm ? 'http://localhost:8000/app/#' : 'https://' + realm + '/nm/#'
    const subject = 'Invitation email to join VICINITY'
    const templateName = type === InvitationType.COMPANY ? TEMP_INVITE_COMPANY : TEMP_INVITE_USER
    const link = `${dns}/invitation/${type}/${id}`
    // Replace info
    const view = {
        LINK: link
    }
    const temp = Mustache.render(templateName, view)
    sendMail(username, undefined, undefined, temp, subject)
}
