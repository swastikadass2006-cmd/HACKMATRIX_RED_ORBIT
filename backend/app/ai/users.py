import random

def generate_users(count=50):

    users = []

    for i in range(count):

        users.append({
            "user_id": f"user_{i+1}",
            "vpa": f"user{i+1}@okaxis",
            "balance": random.randint(5000, 50000),
            "guardian_mode": i % 5 == 0,
            "known_devices": [f"device_{i+1}"],
            "normal_amount": random.randint(200, 2000)
        })

    return users