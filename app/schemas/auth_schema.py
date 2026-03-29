from marshmallow import Schema, fields, validate


class SignupSchema(Schema):
    email = fields.Email(
        required=True, error_messages={"required": "Email is required.", "invalid": "Enter a valid email address."}
    )
    password = fields.String(
        required=True,
        validate=validate.Length(min=8, error="Password must be at least 8 characters."),
        error_messages={"required": "Password is required."},
    )
    business_name = fields.String(
        required=True,
        validate=validate.Length(min=1, error="Business name cannot be blank."),
        error_messages={"required": "Business name is required."},
    )
    business_type = fields.String(
        required=True,
        validate=validate.Length(min=1, error="Business type cannot be blank."),
        error_messages={"required": "Business type is required."},
    )
    # Optional — database default is 'friendly'
    tone_preference = fields.String(
        load_default="friendly",
        validate=validate.OneOf(
            ["friendly", "professional", "formal", "casual"], error="tone_preference must be one of: friendly, professional, formal, casual."
        ),
    )


class LoginSchema(Schema):
    email = fields.Email(
        required=True, error_messages={"required": "Email is required.", "invalid": "Enter a valid email address."}
    )
    password = fields.String(required=True, error_messages={"required": "Password is required."})


class ForgotPasswordSchema(Schema):
    email = fields.Email(
        required=True,
        error_messages={"required": "Email is required.", "invalid": "Enter a valid email address."},
    )


class ResetPasswordSchema(Schema):
    access_token = fields.String(
        required=True,
        error_messages={"required": "Reset token is required."},
    )
    new_password = fields.String(
        required=True,
        validate=validate.Length(min=8, error="Password must be at least 8 characters."),
        error_messages={"required": "New password is required."},
    )


class ResendVerificationSchema(Schema):
    email = fields.Email(
        required=True,
        error_messages={"required": "Email is required.", "invalid": "Enter a valid email address."},
    )


class VerifyEmailSchema(Schema):
    access_token = fields.String(
        required=True,
        error_messages={"required": "Verification token is required."},
    )
