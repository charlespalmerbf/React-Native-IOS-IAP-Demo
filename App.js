import React, { useState, useEffect } from "react";
import { StyleSheet, Text, Alert, View, SafeAreaView, Button, Platform } from "react-native";

import IAP, { validateReceiptAmazon } from "react-native-iap";

const items = Platform.select({
  ios: ["rt_699_1m"],
  android: [""]
})

let purchaseUpdatedListener
let purchaseErrorListener

export default function App() {

  const [purchased, setPurchase] = useState(false)
  const [products, setProducts] = useState({})
  const [checking, setChecking] = useState(false)

  const validate = async (receipt) => {

    setChecking(true)

    const receiptBody = {

      "receipt-data": receipt,
      // "password": "Get From App Store Connect",

    }

    const result = await IAP.validateReceiptIos(receiptBody, true).catch((error) => {

      console.log(error)

    }).then((receipt) => {

      try {

        const renewalHistory = receipt.latest_receipt_info;

        const expiration = renewalHistory[renewalHistory.length - 1].expires_date_ms

        let expired = Date.now() > expiration

        if(!expired) {

          setPurchase(true)

        } else {

          Alert.alert("Purchase Expired", "Your purchase has expired, please resubscribe to regain access to the application.")

        }

        setChecking(false)
        
      } catch (error) {
        


      }

    })

  }
  
  useEffect(() => {

    IAP.initConnection().catch(() => {

      console.log("Error connecting to the store..")

    }).then(() => {

      console.log("Connected to the store..")

      IAP.getSubscriptions(items).catch(() => {

        console.log("Error finding purchases..")

      }).then((res) => {

        console.log("Products have been fetched..")

        setProducts(res)

      })

      IAP.getPurchaseHistory().catch(() => {

        setChecking(false)

      }).then((res) => {

        const receipt = res[res.length - 1].transactionReceipt

        if(receipt) {

          validate(receipt)

        }

      })

    })

    purchaseErrorListener = IAP.purchaseErrorListener((error) => {

      if(error['responseCode'] === "2") {

        //User Canceled 

      } else {

        Alert.alert("Error", "There has been an error with your purchase. Error Code: " + error[code])
        
      }

    })

    purchaseUpdatedListener = IAP.purchaseUpdatedListener((purchase) => {

      try {

        const receipt = purchase.transactionReceipt;

        if(receipt) {

          validate(receipt)

        }
        
      } catch (error) {
        
        console.log(error)

      }

    })

  }, [])

  if(checking) {

    return (
      <View style={styles.container}>

        <Text style={styles.text}> Checking for previous purchases.. </Text>

      </View>
    )

  } else {

    if(purchased) {

      return (
        <View style={styles.container}>
  
          <Text style={styles.text}> Welcome to the paid application! </Text>
  
        </View>
      )
  
    } else {
  
      if(products.length > 0) {
  
        return (
          <View style={styles.container}>
    
            <Text style={styles.text}> {products[0]["title"]} </Text>
            <Text style={styles.text}> 1 Month {products[0]["localizedPrice"]} </Text>
    
            <View style={{height: 4, backgroundColor: "white", width: 50}} />
    
            <View style={{backgroundColor: "rgba(150, 150, 150, 0.25", borderRadius: 10, padding: 10, marginTop: 15}}>
    
              <Text style={styles.text}> Features: </Text>
              <Text style={styles.smallText}>
    
                {"\u2B24"}Ad-free access to the entire app.{"\n"}
                {"\u2B24"}Premium support.{"\n"}
                {"\u2B24"}Better performance package.{"\n"}
    
              </Text>
    
            </View>
    
            <Button title="Purchase" onPress={() => {
    
              IAP.requestSubscription(products[0]["productId"])
    
            }} />
    
          </View>
        )
    
      } else {
    
        return (
          <View style={styles.container}>
    
            <Text style={styles.text}> Fetching products, please wait.. </Text>
    
          </View>
        )
    
      }
  
    }

  }

}

const styles = StyleSheet.create({
  container:{
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center"
  },
  text: {
    color: "white",
    fontSize: 25,
    paddingBottom: 5,
  },
  smallText: {
    color: "white",
    fontSize: 12,
  },
})