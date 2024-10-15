# forms.py
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, EmailField, DateField, SelectField, SubmitField
from wtforms.validators import DataRequired, Length, EqualTo

from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, EmailField, DateField, SelectField, SubmitField, IntegerField
from wtforms.validators import DataRequired, Length, EqualTo

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=25)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6, max=35)])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    email = EmailField('Email', validators=[DataRequired()])
    full_name = StringField('Full Name', validators=[DataRequired()])
    date_of_birth = DateField('Date of Birth', format='%Y-%m-%d', validators=[DataRequired()])
    phone_number = StringField('Phone Number', validators=[DataRequired(), Length(min=10, max=15)])
    government_id_type = SelectField('Government ID Type', choices=[('Aadhar', 'Aadhar'), ('PAN', 'PAN'), ('Passport', 'Passport')], validators=[DataRequired()])
    government_id_number = StringField('Government ID Number', validators=[DataRequired()])
    otp = StringField('OTP')  # Add this line for OTP
    submit = SubmitField('Register')

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')
