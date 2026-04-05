# Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
#
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import datetime
import ipaddress
import os
import sys
import time

def generate_self_signed_cert(cert_path, key_path):
    """Generate a self-signed certificate and private key"""
    try:
        # Check if certificates already exist
        if os.path.exists(cert_path) and os.path.exists(key_path):
            print(f"Certificates already exist at {cert_path} and {key_path}")
            return True
            
        print(f"Generating self-signed certificate...")
        
        # Create directories if they don't exist
        os.makedirs(os.path.dirname(cert_path), exist_ok=True)
        
        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        
        # Generate certificate
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COMMON_NAME, u"localhost"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"Local Development"),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, u"Development"),
        ])
        
        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.datetime.utcnow()
        ).not_valid_after(
            # Valid for 10 years
            datetime.datetime.utcnow() + datetime.timedelta(days=3650)
        ).add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName(u"localhost"),
                x509.IPAddress(ipaddress.IPv4Address(u"127.0.0.1"))
            ]),
            critical=False
        ).sign(private_key, hashes.SHA256())
        
        # Write the certificate
        with open(cert_path, "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        print(f"Certificate written to {cert_path}")
        
        # Write the private key
        with open(key_path, "wb") as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        print(f"Private key written to {key_path}")
        
        # Set appropriate permissions
        os.chmod(cert_path, 0o644)
        os.chmod(key_path, 0o600)
        
        return True
        
    except Exception as e:
        print(f"Error generating certificates: {str(e)}", file=sys.stderr)
        return False

def wait_for_certs():
    """Keep the program running to maintain supervisor process"""
    while True:
        time.sleep(60)

if __name__ == "__main__":
    CERT_PATH = "/app/certs/cert.pem"
    KEY_PATH = "/app/certs/key.pem"
    
    success = generate_self_signed_cert(CERT_PATH, KEY_PATH)
    if success:
        print("Certificate generation complete!")
        # Keep the program running for supervisor
        wait_for_certs()
    else:
        sys.exit(1)