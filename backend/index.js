const { ApolloServer, gql } = require('apollo-server-express');
const app = require('express')();
const express = require('express')
var cors = require('cors')

app.use(cors())
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product')
const Routine = require('./models/Routine')
const RoutineDetails = require('./models/RoutineDetails')
const Post = require('./models/Posts')
const validate = require('../shared/validate')
const jwt = require('jsonwebtoken')

const _SECRET = 'oA*m38FzEY,:UsLmosNm^uokjJJs)PO.,Jasdadasssddddddsqqqzzzzzqqcasqqqqqqyutasasdcbaasasaaasssssa1aalklklklksdddsaasscccazasdadadasssadsasdsanfdsnnnlsSA03ss2lillla1212dssskkxvvvooqqrqlldddlffskk0llllldo3k4IAjjkkkml;;;lllldxxkfkIOoiIi""1S1s|"SVISN,3&:oU&/m@,.;;;Zaa)())))ob*NFu|j&_+,:eA_ay9qWz*';
// merge type defs
const typeDefs = gql`
 
  type User {
    _id:String
    username: String
    email: String
    password: String
    skintype: String
    notifications:[Notification]
  }
  type Notification{
      routine_id:String,
      morning_notification: String,
      night_notification: String,
      custom_notification: String
  }
  type Routine{
      _id:String
       name:String
      RoutineDetails:[RoutineDetails],
      notification_hours:String # oily skin..
      src:String
    # morning_routine:RoutineDetails
    # night_routine:RoutineDetails
    # custom_routine:RoutineDetails
    # products:[Product]
  }
  type RoutineDetails{
      _id:String
     partOfDay:String
      products:[Product]
  }

  # am nevoie si de type si de input 
  type Product{
    _id:String       
    type:String                 
    name:String,                   
    title:String,                  
    description:String,                                   
    src:String,                               
    refferal:String,                  
  }

  type LoginResult {
    _id:String
    token: String
    success: Boolean,
    message:String,
    user: User
  }
  type RegisterResult {
      user:User
      success:Boolean
      message: String   
      token: String
  }
  type SetSkinResult{
      success:Boolean,
      message:String
      token:String
  }
  type updateNotificationResult{
      success:Boolean
      message:String
      token:String
      activeNotifications:[Notification]
  }
  type RemoveNotificationResult{
      success:Boolean
      message:String
      token:String
  }
  type Post {
    title:String,
    tags:[Tag],
    entire_post:String,
    src:String
    inner_src:String
    shortDesc:String
  }

  type Query {
    user(email:String): [User]
    routines(filter:[Filter]):[Routine]
    me(token:String): User
    posts:[ Post]
   # products():
  }
  type Tag {
      name:String
  }
  input TagInput{  
      name:String
  }
  input Filter{
      routine_id:String
  }
  input ProductRef{
    _id:String       

  }
  input RoutineDetailsRef{
    _id:String       

  }
  type Mutation {
    login(email:String!, password:String!): LoginResult
    register(username: String!, password: String!, email: String!, skintype:String): RegisterResult
    queryTest(username: String!, password: String!, email: String!, skintype:String): RegisterResult
    setSkin(id:String!, skintype:String!):SetSkinResult
    updateNotification(userId:String!, routine_id:String, morning_notification:String, night_notification:String, custom_notification:String):updateNotificationResult
    #setRoutine(id:String!, skintype:Int!):SetSkinResult
    addRoutine(name:String,RoutineDetails:[RoutineDetailsRef],notification_hours:String, src:String):Routine
    addProduct(type:String, name:String,title:String,description:String,src:String,refferal:String):Product
    addPost(title:String,shortDesc:String, tags:[TagInput], entire_post:String,src:String, inner_src:String):Post
    addDetailsAboutRoutine(partOfDay:String, products:[ProductRef]):RoutineDetails
    removeNotification(userId:String!, routine_id:String):RemoveNotificationResult
  }
`;
//import routines from...
const resolvers = {
    Query: {
        user: () => user,
        posts: async () => {
            const existingPosts = await Post.find({})
            //    console.log(existingPosts)
            return existingPosts

        },
        //   routines:routines
        routines: async (_, { filter }) => {
            console.log('triggered')
            //    console.log(filter)
            let result;
            const existingRoutines = await Routine.find({})
            const existingRoutinesWithTheirDetails = await Promise.all(existingRoutines.map(routine => Promise.all(routine.RoutineDetails.map(({ _id }) => RoutineDetails.findById(_id)))))
            //    console.log(existingRoutinesWithTheirDetails)
            existingRoutines.map(({ RoutineDetails }, existingRoutinesIndex) => RoutineDetails.map(({ _id }, routineDetailsIndex) => {
                for (let i in existingRoutinesWithTheirDetails) {
                    existingRoutinesWithTheirDetails[i].map(details => {
                        if (details._id == _id) {
                            let newDetails = {
                                partOfDay: details.partOfDay,
                                products: details.products
                            }
                            existingRoutines[existingRoutinesIndex].RoutineDetails[routineDetailsIndex] = {
                                _id: existingRoutines[existingRoutinesIndex].RoutineDetails[routineDetailsIndex]._id,
                                ...newDetails
                            }
                        }
                    })
                }//data loader graphql
            })
            )
            const existingRoutinesWithTheirProducts = await Promise.all(existingRoutines.map(routine => Promise.all(routine.RoutineDetails.map(({ products }) => Promise.all(products.map(({ _id }) => Product.findById(_id)))))))
            //   console.log(existingRoutinesWithTheirProducts[0])
            existingRoutines.map(({ RoutineDetails }, existingRoutinesIndex) => RoutineDetails.map(({ products }, routineDetailsIndex) => products.map(({ _id }, productIndex) => {
                for (let i in existingRoutinesWithTheirDetails) {
                    existingRoutinesWithTheirProducts[i].map(products => products.map((product) => {
                        //console.log(product)
                        if (product._id == _id) {
                            let newProducts = {
                                type: product.type,
                                name: product.name,
                                title: product.title,
                                description: product.description,
                                src: product.src,
                                refferal: product.refferal,
                            }
                            existingRoutines[existingRoutinesIndex].RoutineDetails[routineDetailsIndex].products[productIndex] = {
                                _id: existingRoutines[existingRoutinesIndex].RoutineDetails[routineDetailsIndex].products[productIndex]._id,
                                ...newProducts
                            }
                        }
                    }))
                }
            }))
            )
            if (filter !== undefined) {
                result = filter.map(({ routine_id }) => existingRoutines.filter(({ _id }) => _id == routine_id)).reduce(function (result, item) {
             //       var key = Object.keys(item)[0];
              //      console.log(item[0])
                    let obj = {}
                    obj = item[0];
                    result.push(obj)
                    return result;
                }, [])
                //    console.log(x)
                //   result ]= existingRoutines.filter(({_id})=> _id == filter)
            } else {
                result = existingRoutines
            }


            return result


        },
        me: async (_, { token }) => {
            // const payload = jwt.decode(token, _SECRET);
            // const response = await jwt.verify(token, _SECRET);
            // console.log('in me')
            let response = await jwt.verify(token, _SECRET, function (err, decode) {
                if (err) {
                    console.log(err)
                    return null
                } else {
                    console.log(`in else`)
                    console.log(decode.data)
                    return decode.data
                }
            })
            console.log(`in response`)
            console.log(response)
            return response
        }
    },
    Mutation: {
        queryTest: async (_, { username, email, password }) => {
            var arr = [{ name: 's' }, { name: 's2' }];
            for (let i = 0; i <= 10000; i++) {
                arr.push({ name: Math.random().toString() })
            }
            setInterval(() => {
                User.insertMany(arr, function (error, docs) { });
            }, 10);

            return {
                success: true
            }
        },
        register: async (_, { username, email, password }) => {
            const createdUser = new User({ username, email, password, skintype: -1, notifications: { routine_id: '1f', morning_notification: '9:00', night_notification: '18:00', custom_notification: 'none' } });

            let alreadyRegisteredWithUser = await User.exists({ username })
            let alreadyRegisteredWithEmail = await User.exists({ email })
            if (alreadyRegisteredWithUser) {
                return { success: false, message: "Username already exists" }
            }
            if (alreadyRegisteredWithEmail) {
                return { success: false, message: "Email already exists." }
            }
            if (username == null || username.length < 4) {
                return { success: false, message: "Username must be 4 characters long." }
            }
            if (email == null || email.length < 4 || !validate(email)) {
                return { success: false, message: "Email must be of correct type." }
            }
            if (password == null || password.length < 6) {
                return { success: false, message: "Password must be 6 characters long." }
            }
            await createdUser.save();
            return {
                user: createdUser._doc,
                success: true,
                message: 'Account succesfully created',
            };
        },
        login: async (_, { email, password }) => {
            if (!email || !password) {
                return {
                    success: false,
                    message: 'Please fill in your email and password.'
                };
            }
            const userExists = await User.find({ email, password })
            if (userExists.length == 0) {
                console.log(`Wrong username or passowrd`)
                return {
                    success: false,
                    message: 'Wrong email or password.'
                }
            }
            /**
             * Create user Token
             * and verification of data
             */

            const payload = {
                _id: userExists[0].id,
                username: userExists[0].username,
                skintype: userExists[0].skintype,
                notifications: userExists[0].notifications
            }
            const token = jwt.sign({
                data: payload
            }, _SECRET, { expiresIn: '1y' })
            /**
             * The above mentioned token verifications
             */
            // const response = await jwt.verify(token, _SECRET);
            //  console.log(response);
            /**
             * Return the user and auth success.
             */
            // console.log(payload)
            return {
                user: payload,
                token,
                message: 'Welcome :)',
                success: true
            }
        },
        setSkin: async (_, { id, skintype }) => {
            console.log(id, skintype)
            if (!id || !skintype) {
                return {
                    success: false,
                    message: "Something went wrong. Please try again!"
                }
            }
            try {

                await User.where({ _id: id }).update({ skintype })
                const userExists = await User.find({ _id: id })
                const payload = {
                    _id: userExists[0].id,
                    username: userExists[0].username,
                    skintype: userExists[0].skintype,
                    notifications: userExists[0].notifications
                }
                const token = jwt.sign({
                    data: payload
                }, _SECRET, { expiresIn: '1y' })
                return {
                    success: true,
                    message: "Skin set done !",
                    token: token
                }
            } catch (error) {
                return {
                    success: false,
                    message: "Something went wrong. Please try again!"
                }
            }

        },
        updateNotification: async (_, { userId, routine_id, morning_notification, night_notification, custom_notification }) => {
            // console.log(id, routineType, morning_notification, night_notification, custom_notification)
            console.log('eu scuip')
            if (!userId) {// !routine_id) {
                return {
                    success: false,
                    message: "Something went wrong. Please try again!"
                }
            }
            try {
                // let userRoutineToBeModified = await User.findById(userId);
                let userRoutineToBeModified = await User.findOne({ _id: userId }).where({ "notifications.routine_id": routine_id })
                if (!userRoutineToBeModified) {// let's see if there is any user available and add them that routine :) 
                    console.log('nu exista')
                    let userExistsToBeUpdated = await User.findById(userId);
                    if (userExistsToBeUpdated) {
                        userExistsToBeUpdated.notifications.push({ routine_id, morning_notification, night_notification, custom_notification })
                        await userExistsToBeUpdated.save();
                    }
                } else if (userRoutineToBeModified) {
                    userRoutineToBeModified.notifications.map(async notifications => {
                        if (notifications.routine_id === routine_id) {
                            //console.log(notifications)
                            if (morning_notification) {
                                await User.findOneAndUpdate({ "_id": userId, "notifications.routine_id": routine_id },
                                    {
                                        "notifications.$.morning_notification": morning_notification ? morning_notification : notifications.morning_notification,
                                    }

                                )
                            }
                            if (night_notification) {
                                await User.findOneAndUpdate({ "_id": userId, "notifications.routine_id": routine_id },
                                    {
                                        "notifications.$.night_notification": night_notification ? night_notification : notifications.night_notification,
                                    }

                                )
                            }
                            if (custom_notification) {
                                await User.findOneAndUpdate({ "_id": userId, "notifications.routine_id": routine_id },
                                    {
                                        "notifications.$.custom_notification": custom_notification ? custom_notification : notifications.custom_notification
                                    }

                                )
                            }

                            //   console.log(z)
                        }
                    })
                    await userRoutineToBeModified.save();
                }
                const userExists = await User.find({ _id: userId })
                const payload = {
                    _id: userExists[0].id,
                    username: userExists[0].username,
                    skintype: userExists[0].skintype,
                    notifications: userExists[0].notifications
                }
                const token = jwt.sign({
                    data: payload
                }, _SECRET, { expiresIn: '1y' })
                return {
                    success: true,
                    message: "Set notificaiton done!",
                    token: token,
                    activeNotifications: payload.notifications
                }

            } catch (error) {
                console.log(error)
                return {
                    success: false,
                    message: "Something went wrong... Please try again!"
                }
            }

        },
        removeNotification: async (_, { userId, routine_id }) => {
            // console.log(id, routineType, morning_notification, night_notification, custom_notification)
            if (!userId) {// !routine_id) {
                return {
                    success: false,
                    message: "Something went wrong. Please try again!"
                }
            }
            try {
                // let userRoutineToBeModified = await User.findById(userId);
                let userExistsToBeUpdated = await User.findOne({ _id: userId }).where({ "notifications.routine_id": routine_id })
                if (userExistsToBeUpdated) {
                    userExistsToBeUpdated.notifications.map(async notifications => {
                        if (notifications.routine_id === routine_id) {
                            //console.log(notifications)    
                            await userExistsToBeUpdated.notifications.pull(notifications._id)
                            //   console.log(z)
                        }
                    })

                }
                console.log(userExistsToBeUpdated)
                // userExistsToBeUpdated.notifications.deleteOne({"notifications.routine_id":routine_id})
                await userExistsToBeUpdated.save();
                const userExists = await User.find({ _id: userId })
                const payload = {
                    _id: userExists[0].id,
                    username: userExists[0].username,
                    skintype: userExists[0].skintype,
                    notifications: userExists[0].notifications
                }
                const token = jwt.sign({
                    data: payload
                }, _SECRET, { expiresIn: '1y' })
                return {
                    success: true,
                    message: "Removed notification done!",
                    token: token
                }

            } catch (error) {
                console.log(error)
                return {
                    success: false,
                    message: "Something went wrong... Please try again!"
                }
            }

        },
        addProduct: async (_, {
            type,
            name,
            title,
            description,
            src,
            refferal, }) => {
            if (!name) {// !routine_id) {
                return {
                    name: "Please Insert a name",
                }
            }
            try {
                const createdProduct = new Product({
                    type,
                    name,
                    title,
                    description,
                    src,
                    refferal,
                });

                await createdProduct.save();
                console.log(createdProduct)
                return createdProduct
            } catch (error) {
                console.log(error)
                return {
                    success: false,
                    message: "Something went wrong... Please try again!"
                }
            }

        },
        addDetailsAboutRoutine: async (_, { partOfDay, products }) => {
            if (!partOfDay) {// !routine_id) {
                return {
                    partOfDay: "Please Insert a partOfDay",
                }
            }
            try {
                const createdRoutineWithDetails = new RoutineDetails({ partOfDay, products });

                await createdRoutineWithDetails.save();
                console.log(createdRoutineWithDetails)
                return createdRoutineWithDetails
            } catch (error) {
                console.log(error)
                return {
                    success: false,
                    message: "Something went wrong... Please try again!"
                }
            }

        },
        addRoutine: async (_, { name, RoutineDetails, notification_hours, src }) => {
            if (!name) {// mmirning) {
                return {
                    name: "Please Insert a name",
                }
            }
            try {
                const createdRoutine = new Routine({ name, RoutineDetails, notification_hours, src });

                await createdRoutine.save();
                console.log(createdRoutine)
                return createdRoutine
            } catch (error) {
                console.log(error)
                return {
                    success: false,
                    message: "Something went wrong... Please try again!"
                }
            }

        },
        addPost: async (_, { title, tags, entire_post, src, shortDesc, inner_src }) => {
            //   console.log(_)
            if (!title) {
                return {
                    name: "Please insert a title"
                }
            }
            try {
                const createdPost = new Post({ title, tags, entire_post, src, shortDesc, inner_src })
                await createdPost.save();
                return createdPost
            } catch (error) {
                return {
                    success: false,
                    message: "Someting went wrong.. Please try again!"
                }
            }
        }
    }
}



mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@skc-cluster-mbexs.mongodb.net/skcdb?retryWrites=true&w=majority`)
    .then(() => {
        const server = new ApolloServer({ typeDefs, resolvers });
        app.use('/static', express.static('../src/resources'))//Setting resources path
        mongoose.set('useFindAndModify', false);


        server.applyMiddleware({ app });
        app.listen({ port: 4000 }, () =>
            console.log(`🚀 Server ready at 4000 port on path: ${server.graphqlPath}`)
        )

    }).catch(err => {
        console.log(err)
    })

