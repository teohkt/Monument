const User = require('../models/user');

module.exports.renderRegisterForm = (req, res) => {
    res.render("./pages/users/register")
};

module.exports.postRegister = async (req, res, next) => {
    try {
        const {email, username, password} = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if(err) return next(err);
            req.flash('success', `Welcome to Monument2 ${username}`)
            res.redirect('/eat');
        })

    } catch(e){
        req.flash('error', e.message);
        res.redirect('/register');
    }
}

module.exports.loginForm = (req, res) => {
    res.render("./pages/users/login");
};

module.exports.postLogin = (req, res) => {
    req.flash('success', `Welcome Back ${ req.body.username }!`)
    const redirectUrl = req.session.returnTo || '/eat';
    // console.log(redirectUrl)
    delete req.session.returnTo;
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res) => {
    req.logout();
    // req.flash('success', 'Logged Out Succesfully')
    res.redirect('/');
}