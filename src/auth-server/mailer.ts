import nodemailer from 'nodemailer'
import fs from 'fs'
import Mustache from 'mustache'
import { Attachment } from 'nodemailer/lib/mailer'
import { Config } from '../config'
import { logger } from '../utils/logger'
import { RegistrationType } from '../persistance/registration/types'

const TEMP_RECOVER_PWD = fs.readFileSync(Config.HOME_PATH + '/src/auth-server/templates/recoverPwd.html', 'utf-8')
const TEMP_ACTIVATE_COMPANY = fs.readFileSync(Config.HOME_PATH + '/src/auth-server/templates/activateCompany.html', 'utf-8')
const TEMP_ACTIVATE_USER = fs.readFileSync(Config.HOME_PATH + '/src/auth-server/templates/activateUser.html', 'utf-8')
const TEMP_NOTIFY_APPROVER = fs.readFileSync(Config.HOME_PATH + '/src/auth-server/templates/notifyApprover.html', 'utf-8')
const TEMP_REJECT_REGISTRATION = fs.readFileSync(Config.HOME_PATH + '/src/auth-server/templates/rejectCompany.html', 'utf-8')

const transporter = nodemailer.createTransport({
    host: Config.SMTP.HOST,
    port: Number(Config.SMTP.PORT),
    secure: true, // true for 465, false for other ports
    auth: {
    user: Config.SMTP.USER,
    pass: Config.SMTP.PASSWORD
} })

const sendMail = async (mails: string | string[], cc: string | string[] | undefined, bcc: string | string[] | undefined, html: string, subject: string, attachments?: Attachment[]) => {
    try {
        await transporter.sendMail({
            from: Config.SMTP.USER, // sender address
            to: mails, // list of receivers
            cc: cc, // list of cc receivers
            bcc: bcc, // list of bcc receivers
            subject: subject, // Subject line
            html: html, // html body
            attachments: attachments
        })
    } catch (error) {
        logger.error(error)
    }
}

// Mail types 

export const recoverPassword = async (username: string, token: string, realm?: string) => {
    const dns = realm === 'localhost' || !realm ? 'localhost:4000' : realm
    const subject = 'Password recovery email VICINITY'
    const link = `${dns}/#/authentication/recoverPassword/${token}`
    // TBD: remove after testing
    logger.debug(link)
    // Replace info
    const view = {
        LINK: link
    }
    const temp = Mustache.render(TEMP_RECOVER_PWD, view)
    sendMail(username, undefined, undefined, temp, subject)
}

export const verificationMail = async (username: string, token: string, type: RegistrationType, realm?: string) => {
    const dns = realm === 'localhost' || !realm ? 'localhost:4000' : realm
    const subject = 'Verification email to join VICINITY'
    const templateName = type === RegistrationType.COMPANY ? TEMP_ACTIVATE_COMPANY : TEMP_ACTIVATE_USER
    const link = `${dns}/#/registration/${type}/${token}`
    // TBD: remove after testing
    logger.debug(link)
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
