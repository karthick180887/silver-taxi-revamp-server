import bcrypt

stored_hash = b"$2b$10$bZfNAFDG3d.R/9I09HC48.nSx7tynVuCkCVLTCsCdRJUECXbTvzqS"

password = input("Enter password: ").strip().encode("utf-8")

if bcrypt.checkpw(password, stored_hash):
    print("Password is correct")
else:
    print("Invalid password")
