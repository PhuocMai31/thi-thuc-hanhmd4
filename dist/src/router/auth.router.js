"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loginRoutes = (0, express_1.Router)();
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)();
const bodyParser = __importStar(require("body-parser"));
const passport_1 = __importDefault(require("../middleware/passport"));
const account_model_1 = require("../schemas/account.model");
const fileupload = require('express-fileupload');
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cleanCookie_1 = require("../middleware/cleanCookie");
const mailer = require('../../utils/mailer');
const bcrypt_1 = __importDefault(require("bcrypt"));
const process = __importStar(require("process"));
loginRoutes.use(bodyParser.json());
loginRoutes.use(fileupload({ createParentPath: true }));
loginRoutes.get('/logout', cleanCookie_1.cleanCookie, (req, res) => {
    res.redirect('/auth/login');
});
loginRoutes.get('/login', (req, res) => {
    res.render('login/newlogin-signin1');
});
loginRoutes.post('/login', async (req, res, next) => {
    try {
        console.log(req.body.password);
        console.log(req.body.username);
        const account = await account_model_1.Account.findOne({ username: req.body.username });
        if (account.password == req.body.password) {
            if (account.status == "unverify") {
                return res.send("<script>alert(\"Vui L??ng Ki???m Tra Email X??c Th???c T??i Kho???n\"); window.location.href = \"/auth/login\"; </script>");
            }
            else if (account.status == "verify" && account.role == "user") {
                let payload = {
                    user_id: account["id"],
                    username: account["username"],
                    role: account["role"]
                };
                const token = jsonwebtoken_1.default.sign(payload, '123456789', {
                    expiresIn: 36000,
                });
                res.cookie("name", token);
                res.redirect('/products/list');
            }
            else if (account.role == "admin") {
                let payload = {
                    user_id: account["id"],
                    username: account["username"],
                    role: account["role"]
                };
                const token = jsonwebtoken_1.default.sign(payload, '123456789', {
                    expiresIn: 36000,
                });
                res.cookie("name", token);
                res.redirect('/admin/list');
            }
        }
        else {
            return res.send("<script>alert(\"Wrong Email or Password\"); window.location.href = \"/auth/login\"; </script>");
        }
    }
    catch (error) {
        return res.send("<script>alert(\"L???i Ph??a Server\"); window.location.href = \"/auth/login\"; </script>");
    }
});
loginRoutes.get('/register', (req, res) => {
    res.render('login/newlogin-signin');
});
loginRoutes.post('/register', async (req, res) => {
    try {
        const user = await account_model_1.Account.findOne({ username: req.body.username });
        if (!user) {
            const newAccount = new account_model_1.Account({
                username: req.body.username,
                password: req.body.password,
                role: "user",
                status: "unverify"
            });
            await newAccount.save((err, newAccount) => {
                if (!err) {
                    bcrypt_1.default.hash(newAccount.username, parseInt(process.env.BCRYPT_SALT_ROUND)).then((hashedEmail) => {
                        console.log(newAccount.username);
                        mailer.sendMail(newAccount.username, "Xin Ch??o,H??y x??c th???c t??i kho???n web nghe nh???c Online c??ng Ph?????c ?????p trai v?? Ho??ng Nh???t B???n", `<h4>H??y Nh???n V??o Link D?????i ????y ????? X??c Th???c Email</h4>><br><a href="${process.env.APP_URL}/auth/verify?email=${newAccount.username}&token=${hashedEmail}"> Verify </a>`);
                    });
                }
                else {
                    return res.send("<script>alert(\"Sai ?????nh d???ng t??n t??i kho???n ho???c m???t kh???u vui l??ng nh???p l???i \"); window.location.href = \"/auth/login\"; </script>");
                }
                res.setHeader("Content-Type", "text/html");
                res.send("<script>alert(\"????ng k?? th??nh c??ng. Vui l??ng truy c???p Email x??c th???c t??i kho???n\"); window.location.href = \"/auth/login\"; </script>");
            });
        }
        else {
            res.send("<script>alert(\"This email already exists\"); window.location.href = \"/auth/register\"; </script>");
        }
    }
    catch (err) {
        res.send("<script>alert(\"Sai ?????nh d???ng t??n t??i kho???n ho???c m???t kh???u vui l??ng nh???p l???i \"); window.location.href = \"/auth/register\"; </script>");
    }
});
loginRoutes.get('/verify', async (req, res) => {
    bcrypt_1.default.compare(req.query.email, req.query.token, (err, result) => {
        if (result) {
            console.log(result);
        }
    });
    account_model_1.Account.updateOne({ username: req.query.email }, { $set: { status: "verify" } }, (err, result) => {
        res.send("<script>alert(\"X??c th???c email th??nh c??ng\"); window.location.href = \"/auth/login\"; </script>");
    });
});
loginRoutes.get('/password/reset', (req, res) => {
    res.render('login/forgotPassword');
});
loginRoutes.post('/password/email', async (req, res) => {
    if (!req.body.email) {
        res.redirect('/auth/password/reset');
    }
    else {
        const accResetPass = await account_model_1.Account.findOne({ username: req.body.email });
        if (accResetPass == null) {
            res.send("<script>alert(\"Email kh??ng t???n t???i\"); window.location.href = \"/auth/password/reset\"; </script>");
        }
        else {
            bcrypt_1.default.hash(accResetPass.username, parseInt(process.env.BCRYPT_SALT_ROUND)).then((hashedEmail) => {
                mailer.sendMail(accResetPass.username, "?????i m???t kh???u Web Ch??i Nh???c Email", `<h4>Nh???n V??o Link D?????i ????y ????? Chuy???n Ti???p T???i Trang ?????i M???t Kh???u</h4>><br><a href="${process.env.APP_URL}/auth/password/reset/${accResetPass.username}?token=${hashedEmail}"> Reset Password </a>`);
                console.log(`${process.env.APP_URL}/password/reset/${accResetPass.username}?token=${hashedEmail}`);
            });
            res.send("<script>alert(\"Vui L??ng Ki???m Tra Email ????? L???y L???i M???t Kh???u\"); window.location.href = \"/auth/login\"; </script>");
        }
    }
});
loginRoutes.get('/password/reset/:email', (req, res) => {
    if (!req.params.email || !req.query.token) {
        res.redirect('/password/reset');
    }
    else {
        res.render('login/newPasswordForm', { email: req.params.email, token: req.query.token });
    }
});
loginRoutes.post('/password/reset', (req, res) => {
    const { email, token, password } = req.body;
    console.log(email, token, password);
    if (!email || !token || !password) {
        res.redirect('/password/reset');
    }
    else {
        bcrypt_1.default.compare(email, token, (err, result) => {
            console.log('compare', result);
            if (result == true) {
                account_model_1.Account.updateOne({ username: email }, { $set: { password: password } }, (err, result) => {
                    if (!err) {
                        res.send("<script>alert(\"?????i m???t kh???u th??nh c??ng\"); window.location.href = \"/auth/login\"; </script>");
                    }
                    else {
                        res.send("/500/ERORR");
                    }
                });
            }
            else {
                res.redirect('/password/reset');
            }
        });
    }
});
loginRoutes.get('/login/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
loginRoutes.get('/google/callback', passport_1.default.authenticate('google'), (req, res) => {
    let payload = {
        user_id: "9832489",
        username: "Google",
        role: "account"
    };
    const token = jsonwebtoken_1.default.sign(payload, '123456789', {
        expiresIn: 36000,
    });
    res.cookie("name", token);
    res.redirect('/products/list');
});
exports.default = loginRoutes;
//# sourceMappingURL=auth.router.js.map