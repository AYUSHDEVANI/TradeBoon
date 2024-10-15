function sendOtp() {
    const email = document.querySelector('[name="email"]').value;

    fetch('/send_otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => response.json())
    .then(data => {
        const messageDiv = document.getElementById('otpMessage');
        if (data.success) {
            messageDiv.textContent = 'OTP sent to your email!';
            messageDiv.style.color = 'green';
        } else {
            messageDiv.textContent = data.message;
            messageDiv.style.color = 'red';
        }
    });
}

function verifyOtp() {
    const email = document.querySelector('[name="email"]').value;
    const otp = document.getElementById('otp').value;

    fetch('/verify_otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email, otp: otp })
    })
    .then(response => response.json())
    .then(data => {
        const messageDiv = document.getElementById('otpMessage');
        if (data.success) {
            messageDiv.textContent = 'OTP verified successfully!';
            messageDiv.style.color = 'green';
            // Here you can optionally submit the form if OTP is verified
            document.getElementById('registrationForm').submit();
        } else {
            messageDiv.textContent = data.message;
            messageDiv.style.color = 'red';
        }
    });
}