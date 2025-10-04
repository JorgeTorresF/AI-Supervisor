#!/bin/bash

# AI Agent Supervision System - Test Runner Script
# Comprehensive testing automation for all deployment modes

set -e  # Exit on any error

echo "🚀 AI Agent Supervision System - Test Runner"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$TEST_DIR")"
LOG_DIR="$TEST_DIR/logs"
REPORT_DIR="$TEST_DIR/reports"

# Create directories
mkdir -p "$LOG_DIR" "$REPORT_DIR"

# Test URLs
WEB_APP_URL="https://ncczq77atgsg77atgsg.space.minimax.io"
DEPLOYMENT_DASHBOARD_URL="https://t5pwvhj8jdkp.space.minimax.io"
HYBRID_GATEWAY_URL="ws://localhost:8888/ws"
LOCAL_SERVER_URL="http://localhost:8889"

echo -e "${BLUE}📋 Test Configuration:${NC}"
echo "   Web App: $WEB_APP_URL"
echo "   Deployment Dashboard: $DEPLOYMENT_DASHBOARD_URL"
echo "   Hybrid Gateway: $HYBRID_GATEWAY_URL"
echo "   Local Server: $LOCAL_SERVER_URL"
echo "   Log Directory: $LOG_DIR"
echo "   Report Directory: $REPORT_DIR"
echo ""

# Function to check URL accessibility
check_url() {
    local url=$1
    local name=$2
    
    echo -n "🔍 Checking $name accessibility... "
    
    if curl -s --max-time 10 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ACCESSIBLE${NC}"
        return 0
    else
        echo -e "${RED}❌ NOT ACCESSIBLE${NC}"
        return 1
    fi
}

# Function to check WebSocket connectivity
check_websocket() {
    local url=$1
    local name=$2
    
    echo -n "🔍 Checking $name WebSocket... "
    
    if command -v websocat > /dev/null 2>&1; then
        if timeout 5 websocat "$url" --exit-on-eof < /dev/null > /dev/null 2>&1; then
            echo -e "${GREEN}✅ CONNECTED${NC}"
            return 0
        else
            echo -e "${RED}❌ CONNECTION FAILED${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️ WEBSOCAT NOT AVAILABLE${NC}"
        return 1
    fi
}

# Function to run Python tests
run_python_tests() {
    local test_script=$1
    local test_name=$2
    local log_file="$LOG_DIR/$(basename "$test_script" .py).log"
    
    echo -e "${BLUE}🐍 Running $test_name...${NC}"
    
    if python3 "$test_script" > "$log_file" 2>&1; then
        echo -e "   ${GREEN}✅ $test_name completed successfully${NC}"
        return 0
    else
        echo -e "   ${RED}❌ $test_name failed${NC}"
        echo -e "   📄 Log: $log_file"
        return 1
    fi
}

# Function to install dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing test dependencies...${NC}"
    
    # Check if pip is available
    if command -v pip3 > /dev/null 2>&1; then
        pip3 install -q aiohttp websockets > /dev/null 2>&1 || {
            echo -e "${YELLOW}⚠️ Could not install Python dependencies${NC}"
        }
    fi
    
    # Check if npm is available for websocat alternative
    if command -v npm > /dev/null 2>&1; then
        if ! command -v websocat > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️ websocat not found, WebSocket tests may be limited${NC}"
        fi
    fi
}

# Main test execution
main() {
    local test_type=${1:-"full"}
    
    echo -e "${BLUE}🔧 Test Type: $test_type${NC}"
    echo ""
    
    # Install dependencies
    install_dependencies
    
    # Pre-flight checks
    echo -e "${BLUE}🛫 Pre-flight Checks${NC}"
    echo "------------------------"
    
    local preflight_passed=0
    local total_checks=0
    
    # Check web services
    if check_url "$WEB_APP_URL" "Web Application"; then
        ((preflight_passed++))
    fi
    ((total_checks++))
    
    if check_url "$DEPLOYMENT_DASHBOARD_URL" "Deployment Dashboard"; then
        ((preflight_passed++))
    fi
    ((total_checks++))
    
    if check_url "$LOCAL_SERVER_URL" "Local Server"; then
        ((preflight_passed++))
    fi
    ((total_checks++))
    
    # Check WebSocket
    if check_websocket "$HYBRID_GATEWAY_URL" "Hybrid Gateway"; then
        ((preflight_passed++))
    fi
    ((total_checks++))
    
    echo ""
    echo -e "${BLUE}📊 Pre-flight Results: $preflight_passed/$total_checks services accessible${NC}"
    echo ""
    
    # Run tests based on type
    case $test_type in
        "quick")
            echo -e "${BLUE}⚡ Running Quick Health Checks${NC}"
            echo "================================"
            
            # Quick connectivity tests only
            if [ $preflight_passed -ge 2 ]; then
                echo -e "${GREEN}✅ Quick health check: PASSED${NC}"
            else
                echo -e "${RED}❌ Quick health check: FAILED${NC}"
                exit 1
            fi
            ;;
            
        "minimax")
            echo -e "${BLUE}🤖 Running MiniMax Integration Tests${NC}"
            echo "====================================="
            
            if [ -f "$TEST_DIR/minimax_integration_tester.py" ]; then
                run_python_tests "$TEST_DIR/minimax_integration_tester.py" "MiniMax Integration Tests"
            else
                echo -e "${RED}❌ MiniMax integration test script not found${NC}"
                exit 1
            fi
            ;;
            
        "full")
            echo -e "${BLUE}🔬 Running Full Comprehensive Test Suite${NC}"
            echo "=========================================="
            
            # Run comprehensive tests
            if [ -f "$TEST_DIR/comprehensive_test_suite.py" ]; then
                run_python_tests "$TEST_DIR/comprehensive_test_suite.py" "Comprehensive Test Suite"
            else
                echo -e "${RED}❌ Comprehensive test script not found${NC}"
                exit 1
            fi
            
            # Run MiniMax integration tests
            if [ -f "$TEST_DIR/minimax_integration_tester.py" ]; then
                run_python_tests "$TEST_DIR/minimax_integration_tester.py" "MiniMax Integration Tests"
            fi
            ;;
            
        *)
            echo -e "${RED}❌ Unknown test type: $test_type${NC}"
            echo "Usage: $0 [quick|minimax|full]"
            exit 1
            ;;
    esac
    
    # Generate summary report
    generate_summary_report "$test_type"
    
    echo ""
    echo -e "${GREEN}🎉 Test execution completed!${NC}"
    echo -e "📄 Logs available in: $LOG_DIR"
    echo -e "📊 Reports available in: $REPORT_DIR"
}

# Function to generate summary report
generate_summary_report() {
    local test_type=$1
    local report_file="$REPORT_DIR/test_summary_$(date +%Y%m%d_%H%M%S).txt"
    
    echo -e "${BLUE}📋 Generating Summary Report${NC}"
    
    cat > "$report_file" << EOF
AI Agent Supervision System - Test Summary Report
================================================

Test Execution Date: $(date)
Test Type: $test_type
Test Environment: $(uname -s) $(uname -r)

Test Configuration:
- Web Application: $WEB_APP_URL
- Deployment Dashboard: $DEPLOYMENT_DASHBOARD_URL  
- Hybrid Gateway: $HYBRID_GATEWAY_URL
- Local Server: $LOCAL_SERVER_URL

Log Files:
EOF
    
    # Add log file information
    if [ -d "$LOG_DIR" ]; then
        echo "" >> "$report_file"
        find "$LOG_DIR" -name "*.log" -type f | while read -r logfile; do
            echo "- $(basename "$logfile"): $logfile" >> "$report_file"
        done
    fi
    
    # Add test results if available
    if [ -f "$TEST_DIR/test_report.json" ]; then
        echo "" >> "$report_file"
        echo "Detailed Test Results: $TEST_DIR/test_report.json" >> "$report_file"
    fi
    
    if [ -f "$TEST_DIR/minimax_integration_report.json" ]; then
        echo "MiniMax Integration Results: $TEST_DIR/minimax_integration_report.json" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

Next Steps:
1. Review any failed tests in the log files
2. Check service accessibility for failed connectivity tests
3. Run 'python3 comprehensive_test_suite.py --full' for detailed analysis
4. Run 'python3 minimax_integration_tester.py' for MiniMax-specific testing

For support, please refer to the comprehensive documentation in /comprehensive_docs/
EOF
    
    echo -e "   📄 Summary report saved to: $report_file"
}

# Handle script arguments
if [ $# -eq 0 ]; then
    echo "🤔 No test type specified, running full test suite..."
    main "full"
else
    main "$1"
fi
