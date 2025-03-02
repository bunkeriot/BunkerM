# Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
#
# app/monitor/data_storage.py
import json
from datetime import datetime, timedelta
import os

class HistoricalDataStorage:
    def __init__(self, filename="/app/monitor/data/historical_data.json"):
        self.filename = filename
        self.max_age_days = 7
        # Ensure the data directory exists
        os.makedirs(os.path.dirname(self.filename), exist_ok=True)
        self.ensure_file_exists()

    def ensure_file_exists(self):
        """Initialize the JSON file with proper structure if it doesn't exist"""
        if not os.path.exists(self.filename):
            initial_data = {
                "daily_messages": [],  # For message counts
                "hourly": [],         # For bytes data
                "daily": []           # For bytes data
            }
            self.save_data(initial_data)

    def load_data(self):
        try:
            with open(self.filename, 'r') as f:
                data = json.load(f)
                # Ensure all required keys exist
                if 'daily_messages' not in data:
                    data['daily_messages'] = []
                if 'hourly' not in data:
                    data['hourly'] = []
                if 'daily' not in data:
                    data['daily'] = []
                return data
        except Exception as e:
            print(f"Error loading data: {e}")
            return {
                "daily_messages": [],
                "hourly": [],
                "daily": []
            }

    def save_data(self, data):
        try:
            with open(self.filename, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving data: {e}")

    def update_daily_messages(self, message_count: int):
        """Update daily message count"""
        data = self.load_data()
        current_date = datetime.now().strftime('%Y-%m-%d')
        
        # Find today's entry
        found = False
        for entry in data['daily_messages']:
            if entry['date'] == current_date:
                entry['count'] += message_count
                found = True
                break

        # Add new entry if not found
        if not found:
            data['daily_messages'].append({
                'date': current_date,
                'count': message_count
            })

        # Keep only last 7 days
        cutoff_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        data['daily_messages'] = [
            entry for entry in data['daily_messages']
            if entry['date'] >= cutoff_date
        ]

        self.save_data(data)

    def add_hourly_data(self, bytes_received: float, bytes_sent: float):
        """Add hourly byte rate data"""
        data = self.load_data()
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M')
        
        data['hourly'].append({
            'timestamp': current_time,
            'bytes_received': bytes_received,
            'bytes_sent': bytes_sent
        })
        
        # Keep only last 24 hours of data
        cutoff_time = (datetime.now() - timedelta(hours=24)).strftime('%Y-%m-%d %H:%M')
        data['hourly'] = [
            entry for entry in data['hourly']
            if entry['timestamp'] >= cutoff_time
        ]
        
        self.save_data(data)

    def get_hourly_data(self):
        """Get hourly byte rate data"""
        data = self.load_data()
        hourly_data = data.get('hourly', [])
        
        return {
            'timestamps': [entry['timestamp'] for entry in hourly_data],
            'bytes_received': [entry['bytes_received'] for entry in hourly_data],
            'bytes_sent': [entry['bytes_sent'] for entry in hourly_data]
        }

    def get_daily_messages(self):
        """Get daily message counts for the last 7 days"""
        try:
            data = self.load_data()
            if not data['daily_messages']:  # If no data exists yet
                return {
                    'dates': [],
                    'counts': []
                }
                
            # Sort by date and get last 7 days
            daily_data = sorted(data['daily_messages'], key=lambda x: x['date'])[-7:]
            
            return {
                'dates': [entry['date'] for entry in daily_data],
                'counts': [entry['count'] for entry in daily_data]
            }
        except Exception as e:
            print(f"Error getting daily messages: {e}")
            return {
                'dates': [],
                'counts': []
            }