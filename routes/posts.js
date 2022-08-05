const express = require('express');
const Posts = require('../models/posts')
const router = express.Router();

// const posts =[{
//     title: "test article",
//     createdAt: new Date,
//     description: "Test descrition"
//   }, 
//   {
//     title: "test article 2",
//     createdAt: new Date,
//     description: "Test descrition 2"
// }]

router.get('/', (req, res) => {
    res.render('posts/index.ejs', { posts: posts })
});

router.get('/new', (req, res) => {
    res.render('posts/new.ejs', { posts: new Posts })
});

router.get('/:id', async (req, res) => {
    const posts = await Posts.findById(req.params.id)
    if (posts == null ) res.redirect('/')
    res.render('posts/show.ejs', { posts: posts})
})

router.post('/', async (req, res) => {
    let posts = new Posts({
        title: req.body.title,
        description: req.body.description,
        markdown: req.body.markdown 
    })
    try {
        await posts.save()
        res.redirect(`/posts/${posts.id}`)
    } catch (error) {
        res.render('posts/new', { posts: posts })
    }
})

router.delete('/:id', async (req, res) => {
    await Posts.findByIdAndDelete(req.params.id)
    res.redirect('/');
})

module.exports = router;