import requests
import sys
import json
from datetime import datetime, timedelta

class SlotSwapperAPITester:
    def __init__(self, base_url="https://schedswap.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token1 = None  # User 1 token
        self.token2 = None  # User 2 token
        self.user1_id = None
        self.user2_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)

            success = response.status_code == expected_status
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_user_signup(self, user_num=1):
        """Test user signup"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "name": f"Test User {user_num}",
            "email": f"testuser{user_num}_{timestamp}@example.com",
            "password": "TestPass123!",
            "timezone": "UTC"
        }
        
        success, response = self.run_test(
            f"User {user_num} Signup",
            "POST",
            "auth/signup",
            200,
            data=user_data
        )
        
        if success and 'token' in response:
            if user_num == 1:
                self.token1 = response['token']
                self.user1_id = response['user']['id']
            else:
                self.token2 = response['token']
                self.user2_id = response['user']['id']
            return True, user_data
        return False, {}

    def test_user_login(self, email, password, user_num=1):
        """Test user login"""
        success, response = self.run_test(
            f"User {user_num} Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'token' in response:
            if user_num == 1:
                self.token1 = response['token']
                self.user1_id = response['user']['id']
            else:
                self.token2 = response['token']
                self.user2_id = response['user']['id']
            return True
        return False

    def test_get_me(self, user_num=1):
        """Test get current user"""
        token = self.token1 if user_num == 1 else self.token2
        headers = {'Authorization': f'Bearer {token}'}
        
        success, _ = self.run_test(
            f"Get User {user_num} Profile",
            "GET",
            "auth/me",
            200,
            headers=headers
        )
        return success

    def test_create_event(self, title, status="BUSY", user_num=1):
        """Create an event"""
        token = self.token1 if user_num == 1 else self.token2
        headers = {'Authorization': f'Bearer {token}'}
        
        start_time = datetime.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)
        
        event_data = {
            "title": title,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "status": status
        }
        
        success, response = self.run_test(
            f"Create Event '{title}' (User {user_num})",
            "POST",
            "events",
            200,
            data=event_data,
            headers=headers
        )
        
        return response.get('id') if success else None

    def test_get_events(self, user_num=1):
        """Get user events"""
        token = self.token1 if user_num == 1 else self.token2
        headers = {'Authorization': f'Bearer {token}'}
        
        success, response = self.run_test(
            f"Get Events (User {user_num})",
            "GET",
            "events",
            200,
            headers=headers
        )
        return response if success else []

    def test_update_event_status(self, event_id, new_status, user_num=1):
        """Update event status"""
        token = self.token1 if user_num == 1 else self.token2
        headers = {'Authorization': f'Bearer {token}'}
        
        success, _ = self.run_test(
            f"Update Event Status to {new_status} (User {user_num})",
            "PUT",
            f"events/{event_id}",
            200,
            data={"status": new_status},
            headers=headers
        )
        return success

    def test_delete_event(self, event_id, user_num=1):
        """Delete an event"""
        token = self.token1 if user_num == 1 else self.token2
        headers = {'Authorization': f'Bearer {token}'}
        
        success, _ = self.run_test(
            f"Delete Event (User {user_num})",
            "DELETE",
            f"events/{event_id}",
            200,
            headers=headers
        )
        return success

    def test_get_swappable_slots(self, user_num=1):
        """Get swappable slots from marketplace"""
        token = self.token1 if user_num == 1 else self.token2
        headers = {'Authorization': f'Bearer {token}'}
        
        success, response = self.run_test(
            f"Get Swappable Slots (User {user_num})",
            "GET",
            "swappable-slots",
            200,
            headers=headers
        )
        return response if success else []

    def test_create_swap_request(self, my_slot_id, their_slot_id, user_num=1):
        """Create a swap request"""
        token = self.token1 if user_num == 1 else self.token2
        headers = {'Authorization': f'Bearer {token}'}
        
        swap_data = {
            "my_slot_id": my_slot_id,
            "their_slot_id": their_slot_id
        }
        
        success, response = self.run_test(
            f"Create Swap Request (User {user_num})",
            "POST",
            "swap-request",
            200,
            data=swap_data,
            headers=headers
        )
        
        return response.get('id') if success else None

    def test_get_incoming_requests(self, user_num=1):
        """Get incoming swap requests"""
        token = self.token1 if user_num == 1 else self.token2
        headers = {'Authorization': f'Bearer {token}'}
        
        success, response = self.run_test(
            f"Get Incoming Requests (User {user_num})",
            "GET",
            "swap-requests/incoming",
            200,
            headers=headers
        )
        return response if success else []

    def test_get_outgoing_requests(self, user_num=1):
        """Get outgoing swap requests"""
        token = self.token1 if user_num == 1 else self.token2
        headers = {'Authorization': f'Bearer {token}'}
        
        success, response = self.run_test(
            f"Get Outgoing Requests (User {user_num})",
            "GET",
            "swap-requests/outgoing",
            200,
            headers=headers
        )
        return response if success else []

    def test_respond_to_swap(self, request_id, accepted, user_num=1):
        """Respond to a swap request"""
        token = self.token1 if user_num == 1 else self.token2
        headers = {'Authorization': f'Bearer {token}'}
        
        action = "Accept" if accepted else "Reject"
        success, _ = self.run_test(
            f"{action} Swap Request (User {user_num})",
            "POST",
            f"swap-response/{request_id}",
            200,
            data={"accepted": accepted},
            headers=headers
        )
        return success

def main():
    print("🚀 Starting SlotSwapper API Tests...")
    tester = SlotSwapperAPITester()
    
    # Test 1: User Registration and Authentication
    print("\n📝 Testing User Authentication...")
    success1, user1_data = tester.test_user_signup(1)
    success2, user2_data = tester.test_user_signup(2)
    
    if not (success1 and success2):
        print("❌ User signup failed, stopping tests")
        return 1
    
    # Test login with created users
    tester.test_user_login(user1_data['email'], user1_data['password'], 1)
    tester.test_user_login(user2_data['email'], user2_data['password'], 2)
    
    # Test get me endpoint
    tester.test_get_me(1)
    tester.test_get_me(2)
    
    # Test 2: Event Management
    print("\n📅 Testing Event Management...")
    
    # Create events for both users
    event1_id = tester.test_create_event("User 1 Meeting", "BUSY", 1)
    event2_id = tester.test_create_event("User 1 Swappable Slot", "SWAPPABLE", 1)
    event3_id = tester.test_create_event("User 2 Meeting", "BUSY", 2)
    event4_id = tester.test_create_event("User 2 Swappable Slot", "SWAPPABLE", 2)
    
    if not all([event1_id, event2_id, event3_id, event4_id]):
        print("❌ Event creation failed, stopping tests")
        return 1
    
    # Test get events
    tester.test_get_events(1)
    tester.test_get_events(2)
    
    # Test update event status
    tester.test_update_event_status(event1_id, "SWAPPABLE", 1)
    tester.test_update_event_status(event2_id, "BUSY", 1)
    
    # Test 3: Marketplace
    print("\n🛒 Testing Marketplace...")
    
    # Get swappable slots (should see other user's slots)
    slots1 = tester.test_get_swappable_slots(1)  # User 1 sees User 2's slots
    slots2 = tester.test_get_swappable_slots(2)  # User 2 sees User 1's slots
    
    # Test 4: Swap Requests
    print("\n🔄 Testing Swap Functionality...")
    
    # Create swap request (User 1 requests User 2's slot)
    if event2_id and event4_id:
        # First make sure both slots are swappable
        tester.test_update_event_status(event2_id, "SWAPPABLE", 1)
        tester.test_update_event_status(event4_id, "SWAPPABLE", 2)
        
        # Create swap request
        swap_request_id = tester.test_create_swap_request(event2_id, event4_id, 1)
        
        if swap_request_id:
            # Test getting requests
            tester.test_get_incoming_requests(2)  # User 2 should see incoming request
            tester.test_get_outgoing_requests(1)  # User 1 should see outgoing request
            
            # Test accepting swap
            tester.test_respond_to_swap(swap_request_id, True, 2)
            
            # Verify events after swap
            tester.test_get_events(1)
            tester.test_get_events(2)
    
    # Test 5: Event Deletion
    print("\n🗑️ Testing Event Deletion...")
    if event3_id:
        tester.test_delete_event(event3_id, 2)
    
    # Test 6: Error Cases
    print("\n⚠️ Testing Error Cases...")
    
    # Test unauthorized access
    tester.run_test(
        "Unauthorized Access",
        "GET",
        "events",
        401,
        headers={'Authorization': 'Bearer invalid-token'}
    )
    
    # Test duplicate email signup
    tester.run_test(
        "Duplicate Email Signup",
        "POST",
        "auth/signup",
        400,
        data=user1_data
    )
    
    # Print final results
    print(f"\n📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    # Save detailed results
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed / tester.tests_run) * 100,
            'detailed_results': tester.test_results
        }, f, indent=2)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())