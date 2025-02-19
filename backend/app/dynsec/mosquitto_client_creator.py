# mosquitto_client_creator.py
import subprocess
import argparse
import sys
import logging
import getpass

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_mqtt_client(admin_username: str, admin_password: str, client_username: str) -> bool:
    """
    Create a new MQTT client using mosquitto_ctrl dynsec command with admin authentication
    
    Args:
        admin_username (str): The admin username for mosquitto_ctrl
        admin_password (str): The admin password for mosquitto_ctrl
        client_username (str): The username for the new client to be created
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Build the command with admin authentication
        command = [
            "mosquitto_ctrl",
            "-u", admin_username,
            "-P", admin_password,
            "dynsec",
            "createClient",
            client_username
        ]
            
        logger.info(f"Creating new client: {client_username}")
        
        # Get the new client's password
        client_password = getpass.getpass(f"Enter password for new client '{client_username}': ")
        
        # Execute the command and pipe the password to it
        process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Send the password to the process
        stdout, stderr = process.communicate(input=f"{client_password}\n")
        
        # Check if the command was successful
        if process.returncode == 0:
            logger.info(f"Successfully created client: {client_username}")
            if stdout:
                logger.info(f"Command output: {stdout}")
            return True
        else:
            logger.error(f"Failed to create client. Error: {stderr}")
            return False
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to create client. Error: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"An unexpected error occurred: {str(e)}")
        return False

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Create a new MQTT client using mosquitto_ctrl')
    parser.add_argument('admin_username', help='Admin username for mosquitto_ctrl')
    parser.add_argument('client_username', help='Username for the new client')
    
    # Admin password will be prompted securely
    args = parser.parse_args()
    
    # Get admin password securely
    admin_password = getpass.getpass(f"Enter admin password for '{args.admin_username}': ")
    
    # Create the client
    success = create_mqtt_client(
        admin_username=args.admin_username,
        admin_password=admin_password,
        client_username=args.client_username
    )
    
    # Exit with appropriate status code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
