# Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
#
# app/monitor/data/generate_dummy_data.py
import json
from datetime import datetime, timedelta
import random

def generate_byte_rate(hour):
    """Generate realistic byte rates based on time of day"""
    # Base rate: 1-5 MB
    base_rate = random.uniform(1_000_000, 5_000_000)
    
    # Add time-based patterns
    if 9 <= hour < 17:  # Business hours: higher traffic
        base_rate *= random.uniform(2, 4)
    elif 0 <= hour < 6:  # Night hours: lower traffic
        base_rate *= random.uniform(0.3, 0.7)
        
    return round(base_rate, 2)

def generate_dummy_data():
    current_time = datetime.now()
    
    # Generate hourly data (last 6 hours, 30-min intervals)
    hourly_data = []
    for i in range(12):  # 6 hours * 2 (30-min intervals)
        time = current_time - timedelta(minutes=30 * i)
        received = generate_byte_rate(time.hour)
        sent = generate_byte_rate(time.hour) * random.uniform(0.7, 0.9)  # Sent is usually less than received
        
        hourly_data.append({
            'timestamp': time.strftime('%Y-%m-%d %H:%M'),
            'bytes_received': received,
            'bytes_sent': sent
        })

    # Generate daily data (last 7 days)
    daily_data = []
    for i in range(7):
        date = (current_time - timedelta(days=i)).date()
        # Aggregate multiple readings for daily total
        daily_received = sum(generate_byte_rate(h) for h in range(24)) / 24
        daily_sent = daily_received * random.uniform(0.7, 0.9)
        
        daily_data.append({
            'date': date.strftime('%Y-%m-%d'),
            'bytes_received': daily_received,
            'bytes_sent': daily_sent
        })

    # Create the final data structure
    dummy_data = {
        'hourly': list(reversed(hourly_data)),  # Reverse to get chronological order
        'daily': list(reversed(daily_data))
    }

    # Save to JSON file
    with open('historical_data.json', 'w') as f:
        json.dump(dummy_data, f, indent=2)

if __name__ == "__main__":
    generate_dummy_data()
    print("Dummy data has been generated in historical_data.json")