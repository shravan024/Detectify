const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({ isVerified: Boolean });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

mongoose.connect('mongodb://kolishravan024_db_user:oCkjgWY2N3AnMLGc@ac-lom8uwb-shard-00-00.y2y3rbm.mongodb.net:27017,ac-lom8uwb-shard-00-01.y2y3rbm.mongodb.net:27017,ac-lom8uwb-shard-00-02.y2y3rbm.mongodb.net:27017/ai-detector?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=DATA')
  .then(async () => {
    const total = await User.countDocuments();
    const count = await User.countDocuments({ isVerified: { $ne: true } });
    const first = await User.findOne({ isVerified: { $ne: true } });
    console.log('TOTAL:' + total);
    console.log('UNVERIFIED:' + count);
    console.log('FIRST:', JSON.stringify(first));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
